/**
 * Custom hook for Azure Blob Storage operations
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeAzureStorage, CONTAINER_CONFIG, ensureContainersExist } from '../config/azure';
import { getFileType } from '../utils/fileUtils';
import { useCosmosDB } from './useCosmosDB';

/**
 * Custom hook for Azure Blob Storage operations
 * @returns {Object} Azure Blob Storage operations and state
 */
export const useAzureStorage = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const containersVerifiedRef = useRef(false);

  // Use Cosmos DB hook
  const {
    saveMediaMetadata,
    getAllMedia,
    deleteMedia
  } = useCosmosDB();

  // Memoize the result of initializeAzureStorage to prevent recreating on every render
  const { blobServiceClient, isConfigured } = useMemo(() => initializeAzureStorage(), []);

  // Initialize containers when the component mounts - only once
  useEffect(() => {
    // Only run this effect once
    if (isConfigured && blobServiceClient && !containersVerifiedRef.current) {
      containersVerifiedRef.current = true;
      ensureContainersExist(blobServiceClient).catch(err => {
        console.error('Failed to ensure containers exist:', err);
        setError('Failed to initialize storage containers. Please check your Azure configuration.');
      });
    } else if (!isConfigured) {
      // Set a clear error message when Azure is not configured
      setError('Azure Storage is not configured. Please check your environment variables.');
    }
  }, [isConfigured, blobServiceClient]);

  /**
   * Fetch all files from Azure Blob Storage and Cosmos DB
   */
  const fetchFiles = useCallback(async () => {
    if (!isConfigured) {
      setError('Azure Storage is not configured. Please check your environment variables.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get metadata from Cosmos DB first
      const cosmosItems = await getAllMedia();

      if (cosmosItems && cosmosItems.length > 0) {
        // If we have items in Cosmos DB, use those
        setMediaFiles(cosmosItems);
      } else {
        // Fallback to fetching from Blob Storage if Cosmos DB is empty or fails
        const allFiles = [];

        for (const [type, config] of Object.entries(CONTAINER_CONFIG)) {
          const containerClient = blobServiceClient.getContainerClient(config.name);
          const blobItems = containerClient.listBlobsFlat();

          for await (const blob of blobItems) {
            const blobClient = containerClient.getBlockBlobClient(blob.name);

            // Use current date as fallback for creation date
            // Skip getting properties to avoid CORS issues
            const createdOn = new Date();

            allFiles.push({
              id: `${type}-${blob.name}`,
              name: blob.name,
              url: blobClient.url,
              type,
              containerName: config.name,
              createdOn,
              uploadDate: createdOn.toISOString()
            });
          }
        }

        // Sort files by creation date (newest first)
        allFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        setMediaFiles(allFiles);
      }
    } catch (err) {
      console.error('Error fetching files:', err);

      // Set a generic error message
      setError('Failed to fetch files. Please try again later.');

      // Still return some data to prevent UI from being empty
      setMediaFiles(prevFiles => prevFiles.length > 0 ? prevFiles : []);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Upload a file to Azure Blob Storage
   * @param {File} file - File to upload
   * @returns {Promise<boolean>} - True if upload was successful
   */
  const uploadFile = useCallback(async (file) => {
    if (!file) {
      setError('No file selected');
      return false;
    }

    if (!isConfigured) {
      setError('Azure Storage is not configured. Please check your environment variables.');
      return false;
    }

    // Determine file type based on MIME type
    const fileType = getFileType(file.type);
    const containerConfig = CONTAINER_CONFIG[fileType];

    if (!containerConfig) {
      setError(`Unsupported file type: ${file.type}. Please upload an image, video, or audio file.`);
      return false;
    }

    if (!containerConfig.allowedTypes.includes(file.type)) {
      // Create a more detailed error message with supported formats
      const supportedFormats = containerConfig.allowedTypes
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');

      setError(`This ${fileType} format (${file.type.split('/')[1]}) is not supported. Supported formats: ${supportedFormats}`);
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      // Generate a unique ID for this upload
      const uniqueId = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      // Check if a file with this name already exists in Cosmos DB
      try {
        const allItems = await getAllMedia();
        const existingItem = allItems.find(item => 
          item.fileName === file.name || 
          item.title === file.name.split('.')[0] ||
          (item.blobName && item.blobName.includes(file.name))
        );
        
        if (existingItem) {
          console.log(`File with name ${file.name} already exists in Cosmos DB. Using existing record.`);
          setLoading(false);
          return true;
        }
      } catch (err) {
        console.error('Error checking for existing file:', err);
        // Continue with upload if check fails
      }

      const containerClient = blobServiceClient.getContainerClient(containerConfig.name);

      // Use timestamp to ensure unique filenames
      const blobName = `${Date.now()}-${file.name}`;
      const blobClient = containerClient.getBlockBlobClient(blobName);

      // Upload with progress tracking
      // For larger files (over 20MB), use block blob upload for better reliability
      const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024; // 20MB

      if (file.size > LARGE_FILE_THRESHOLD) {
        console.log(`Large file detected (${Math.round(file.size / (1024 * 1024))}MB), using block blob upload`);

        // For larger files, use a block size of 4MB
        const BLOCK_SIZE = 4 * 1024 * 1024; // 4MB blocks
        const totalBlocks = Math.ceil(file.size / BLOCK_SIZE);
        const blockIds = [];

        // Set content type
        await blobClient.setHTTPHeaders({
          blobContentType: file.type
        });

        // Upload file in blocks
        for (let i = 0; i < totalBlocks; i++) {
          const start = i * BLOCK_SIZE;
          const end = Math.min(file.size, start + BLOCK_SIZE);
          const blockContent = file.slice(start, end);

          // Create a base64 block ID
          const blockId = btoa(`block-${i.toString().padStart(8, '0')}`);
          blockIds.push(blockId);

          // Upload the block
          await blobClient.stageBlock(blockId, blockContent, blockContent.size);

          // Update progress
          const percentComplete = Math.round(((i + 1) / totalBlocks) * 100);
          setUploadProgress(percentComplete);
        }

        // Commit the blocks
        await blobClient.commitBlockList(blockIds);
      } else {
        // For smaller files, use simple upload
        await blobClient.uploadData(file, {
          blobHTTPHeaders: { blobContentType: file.type },
          onProgress: (progress) => {
            const percentComplete = Math.round((progress.loadedBytes / file.size) * 100);
            setUploadProgress(percentComplete);
          }
        });
      }

      // Get the correct media type for Cosmos DB categorization
      const mediaType = file.type.split('/')[0]; // 'image', 'audio', or 'video'

      // Create metadata for Cosmos DB
      const mediaMetadata = {
        id: uniqueId,
        title: file.name.split('.')[0], // Use filename as title
        description: '',
        tags: [],
        fileName: file.name,
        blobName: blobName,
        blobUrl: blobClient.url,
        contentType: file.type,
        fileSize: file.size,
        containerName: containerConfig.name,
        uploadDate: new Date().toISOString(),
        type: containerConfig.name.replace('s', ''), // 'image', 'audio', or 'video'
        mediaType: mediaType // Add this to ensure consistent mediaType
      };

      // Save metadata to Cosmos DB
      await saveMediaMetadata(mediaMetadata);

      await fetchFiles();
      return true;
    } catch (err) {
      console.error('Error uploading file:', err);

      // Provide more specific error message based on the error type
      if (err.name === 'AbortError') {
        setError(`Upload of ${file.name} was aborted. Please try again.`);
      } else if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
        setError(`Upload of ${file.name} timed out. Please check your network connection and try again.`);
      } else if (err.statusCode === 403 || err.message?.includes('forbidden') || err.message?.includes('permission')) {
        setError(`Permission denied when uploading ${file.name}. Please check your Azure Storage permissions.`);
      } else {
        setError(`Failed to upload ${file.name}. ${err.message || 'Please try again later.'}`);
      }

      return false;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFiles]);

  /**
   * Delete a file from Azure Blob Storage
   * @param {string} blobName - Name of the blob to delete
   * @param {string} containerName - Name of the container
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  const deleteFile = useCallback(async (blobName, containerName) => {
    if (!isConfigured) {
      setError('Azure Storage is not configured. Please check your environment variables.');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlockBlobClient(blobName);

      // Delete the blob from storage
      await blobClient.delete();

      // Find and delete the metadata from Cosmos DB
      // First, get all media items
      const allItems = await getAllMedia();

      // Find the item with matching blobName
      const itemToDelete = allItems?.find(item => item.blobName === blobName);

      // If found, delete it from Cosmos DB
      if (itemToDelete && itemToDelete.id) {
        await deleteMedia(itemToDelete.id);
      }

      await fetchFiles();
      return true;
    } catch (err) {
      console.error('Error deleting file:', err);

      // Provide more specific error message based on the error type
      if (err.statusCode === 404 || err.message?.includes('not found')) {
        setError(`File ${blobName} not found. It may have been deleted already.`);
      } else if (err.statusCode === 403 || err.message?.includes('forbidden') || err.message?.includes('permission')) {
        setError(`Permission denied when deleting ${blobName}. Please check your Azure Storage permissions.`);
      } else {
        setError(`Failed to delete ${blobName}. ${err.message || 'Please try again later.'}`);
      }

      return false;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFiles]);

  // Fetch files only once when the component mounts
  useEffect(() => {
    let isMounted = true;

    if (isConfigured && blobServiceClient) {
      setLoading(true);

      // Define a function to fetch files without using the fetchFiles callback
      const loadInitialFiles = async () => {
        try {
          // First try to get files from Cosmos DB
          try {
            console.log("Attempting to fetch media from Cosmos DB...");
            const cosmosItems = await getAllMedia();
            
            if (cosmosItems && cosmosItems.length > 0) {
              console.log(`Retrieved ${cosmosItems.length} items from Cosmos DB`);
              
              // Ensure all required properties are present
              const validItems = cosmosItems.map(item => ({
                id: item.id || `id-${Date.now()}`,
                name: item.fileName || item.blobName || `unknown-${Date.now()}`,
                url: item.blobUrl || "",
                type: item.mediaType || "image",
                containerName: item.containerName || "images",
                createdOn: item.uploadDate || new Date().toISOString(),
                title: item.title || "",
                description: item.description || "",
                contentType: item.contentType || "image/jpeg"
              }));
              
              if (isMounted) {
                setMediaFiles(validItems);
                setLoading(false);
                return;
              }
            } else {
              console.log("No items found in Cosmos DB, falling back to Blob Storage");
            }
          } catch (cosmosError) {
            console.error("Error fetching from Cosmos DB, falling back to Blob Storage:", cosmosError);
          }

          // Fall back to Blob Storage if Cosmos DB fails or is empty
          const allFiles = [];

          for (const [type, config] of Object.entries(CONTAINER_CONFIG)) {
            try {
              const containerClient = blobServiceClient.getContainerClient(config.name);
              const blobItems = containerClient.listBlobsFlat();

              for await (const blob of blobItems) {
                if (!isMounted) return; // Stop if component unmounted

                const blobClient = containerClient.getBlockBlobClient(blob.name);
                const createdOn = new Date().toISOString();

                // Create a properly structured item
                const mediaItem = {
                  id: `${type}-${blob.name}`,
                  name: blob.name,
                  url: blobClient.url,
                  type,
                  containerName: config.name,
                  createdOn,
                  // Add these fields to ensure consistency with Cosmos DB structure
                  title: blob.name.split('.')[0],
                  description: "",
                  contentType: `${type}/${blob.name.split('.').pop() || "unknown"}`
                };

                allFiles.push(mediaItem);
              }
            } catch (containerErr) {
              console.error(`Error fetching from ${config.name}:`, containerErr);
            }
          }

          if (isMounted && allFiles.length > 0) {
            console.log(`Retrieved ${allFiles.length} items from Blob Storage`);
            setMediaFiles(allFiles);
            setError(null);
          } else if (isMounted) {
            console.log("No files found in Blob Storage");
            setMediaFiles([]);
          }
        } catch (err) {
          console.error('Error loading initial files:', err);
          if (isMounted) {
            setError('Failed to load files. Please try again later.');
            setMediaFiles([]);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadInitialFiles();
    }

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  return {
    mediaFiles,
    loading,
    error,
    uploadProgress,
    uploadFile,
    deleteFile,
    fetchFiles,
    isConfigured
  };
};
