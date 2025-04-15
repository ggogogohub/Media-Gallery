/**
 * Main Application Component
 *
 * This is the main component of the Media Haven application.
 * It provides a user interface for uploading, viewing, and managing media files
 * stored in Azure Blob Storage.
 */

import { useEffect, useState } from 'react';
import './App.css';
import './styles/ModernCard.css';
import './styles/ModernHeader.css';
import './styles/enhancedMediaPreview.css';
import './styles/toast.css';
import './styles/deleteConfirmation.css';
import './styles/MediaTypeFilter.css';
import './styles/base64Demo.css';

// Custom hooks
import { useAzureStorage } from './hooks/useAzureStorage';
import { useThemeMode } from './hooks/useThemeMode';
import { useToast } from './hooks/useToast';

// Components
import ModernHeader from './components/ModernHeader';
import UploadForm from './components/UploadForm';
import MediaGallery from './components/MediaGallery';
import Loading from './components/Loading';
import ToastManager from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';
import DeleteConfirmation from './components/DeleteConfirmation';
import MediaTypeFilter from './components/MediaTypeFilter';
import Base64Demo from './components/Base64Demo';

// Cosmos DB Service
import { deleteMediaItem, getMediaItemsByType } from './services/cosmosService';

/**
 * App Component
 * @returns {JSX.Element} The rendered App component
 */
const App = () => {
  // Initialize custom hooks
  const {
    loading,
    error,
    uploadProgress,
    uploadFile,
    deleteFile,
    isConfigured
  } = useAzureStorage();

  const { darkMode, toggleDarkMode } = useThemeMode();
  const { showSuccessToast, showErrorToast } = useToast();

  // State to control the upload form visibility
  const [showUploadForm, setShowUploadForm] = useState(false);

  // State to control the base64 demo visibility
  const [showBase64Demo, setShowBase64Demo] = useState(false);

  // State for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    fileName: '',
    blobName: '',
    containerName: '',
    mediaType: ''
  });

  // Add state for media type filter
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [filteredMediaFiles, setFilteredMediaFiles] = useState([]);

  // Show error toast if Azure Storage is not configured
  useEffect(() => {
    if (!isConfigured) {
      showErrorToast(
        'Azure Storage is not configured. Please check your environment variables.',
        10000
      );
    }
  }, [isConfigured, showErrorToast]);

  // Show error toast if there's an error fetching files - only once per error message
  useEffect(() => {
    if (error) {
      // For errors, show toast but limit frequency
      const errorKey = typeof error === 'string' ? error : 'unknown-error';
      const lastShownTime = sessionStorage.getItem(`error-shown-${errorKey}`);
      const now = Date.now();

      // Only show the same error once every 5 seconds
      if (!lastShownTime || (now - parseInt(lastShownTime, 10)) > 5000) {
        // Use a longer duration for important errors
        const duration = error.includes('not configured') || error.includes('permission') ? 10000 : 5000;
        showErrorToast(error, duration);
        sessionStorage.setItem(`error-shown-${errorKey}`, now.toString());
      }
    }
  }, [error, showErrorToast]);

  // Effect to filter media files when type changes
  useEffect(() => {
    const filterMediaFiles = async () => {
      try {
        // Load media files from Cosmos DB based on type
        let items = await getMediaItemsByType(selectedMediaType);

        // Deduplicate items by fileName
        const uniqueItems = new Map();
        items.forEach(item => {
          const key = item.fileName || item.name || item.id;
          if (!uniqueItems.has(key)) {
            uniqueItems.set(key, item);
          }
        });

        items = Array.from(uniqueItems.values());
        console.log(`App: Retrieved ${items.length} unique ${selectedMediaType} items`);

        setFilteredMediaFiles(items);
      } catch (error) {
        console.error('Error filtering media files:', error);
        showErrorToast('Failed to filter media files');
      }
    };

    if (isConfigured) {
      filterMediaFiles();
    }
  }, [selectedMediaType, showErrorToast, isConfigured]);

  /**
   * Handle file upload
   * @param {File} file - File to upload
   * @returns {Promise<boolean>} - True if upload was successful
   */
  const handleUpload = async (file) => {
    try {
      if (loading) return false;

      // Upload the file using the hook, which handles Cosmos DB metadata creation
      const success = await uploadFile(file);

      if (success) {
        showSuccessToast(`${file.name} uploaded successfully!`);
        setShowUploadForm(false);

        // Refresh the media files list
        const items = await getMediaItemsByType(selectedMediaType);
        setFilteredMediaFiles(items);

        return true;
      } else {
        if (!error) {
          showErrorToast(`Failed to upload ${file.name}. Please try a different file.`);
        }
        return false;
      }
    } catch (err) {
      showErrorToast(`Failed to upload ${file.name}: ${err.message}`);
      return false;
    }
  };

  /**
   * Toggle the upload form visibility
   */
  const toggleUploadForm = () => {
    setShowUploadForm(prev => !prev);
  };

  /**
   * Open delete confirmation dialog
   * @param {string} blobName - Name of the blob to delete
   * @param {string} containerName - Name of the container
   * @param {string} mediaType - Type of media ('image', 'audio', or 'video')
   */
  const openDeleteConfirmation = (blobName, containerName, mediaType) => {
    // Extract file name for display
    const fileName = blobName.split('/').pop();

    setDeleteConfirmation({
      isOpen: true,
      fileName,
      blobName,
      containerName,
      mediaType
    });
  };

  /**
   * Close delete confirmation dialog
   */
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      fileName: '',
      blobName: '',
      containerName: '',
      mediaType: ''
    });
  };

  /**
   * Handle file deletion after confirmation
   */
  const handleConfirmDelete = async () => {
    if (loading) return;

    const { blobName, containerName, mediaType } = deleteConfirmation;

    try {
      console.log(`Attempting to delete file: ${blobName} from container: ${containerName}, media type: ${mediaType}`);

      // Check if blobName is valid for deletion
      if (!blobName || blobName === 'unknown-file') {
        console.error('Invalid blobName for deletion:', blobName);
        showErrorToast('Invalid file name for deletion. Please try again.');
        closeDeleteConfirmation();
        return;
      }

      // Flag to track overall success
      let cosmosDeleteSuccess = false;
      let blobDeleteSuccess = false;

      // Delete from Cosmos DB first - this has higher chance of success
      try {
        // Try to find the item by blobName
        console.log(`Searching for item in Cosmos DB with blobName: ${blobName}`);
        const items = await getMediaItemsByType(mediaType);
        console.log(`Found ${items.length} items of type ${mediaType}`);

        // Look for item with matching blobName, fileName, or name
        const itemToDelete = items.find(item => {
          const match =
            (item.blobName && item.blobName === blobName) ||
            (item.fileName && item.fileName === blobName) ||
            (item.name && item.name === blobName);

          if (match) {
            console.log(`Found matching item: ID=${item.id}, blobName=${item.blobName}, fileName=${item.fileName}`);
          }
          return match;
        });

        if (itemToDelete) {
          console.log(`Found item to delete in Cosmos DB: ${itemToDelete.id}`);

          // Log all relevant data to help diagnose issues
          console.log('Item details:', {
            id: itemToDelete.id,
            mediaType: itemToDelete.mediaType || itemToDelete.type,
            containerName: itemToDelete.containerName,
            blobName: itemToDelete.blobName,
            fileName: itemToDelete.fileName
          });

          await deleteMediaItem(itemToDelete.id, mediaType);
          console.log(`Deleted item from Cosmos DB: ${itemToDelete.id}`);
          cosmosDeleteSuccess = true;
        } else {
          console.warn(`No matching item found in Cosmos DB for: ${blobName}`);

          // If no match found, log all available items to help diagnose
          console.log('Available items:', items.map(item => ({
            id: item.id,
            blobName: item.blobName,
            fileName: item.fileName || item.name
          })));
        }
      } catch (cosmosError) {
        console.error('Error deleting from Cosmos DB:', cosmosError);
        // Continue with blob deletion even if Cosmos DB deletion fails
      }

      // Try to delete from blob storage
      try {
        // Delete from blob storage
        console.log(`Attempting to delete blob: ${blobName} from container: ${containerName}`);
        const success = await deleteFile(blobName, containerName);

        if (success) {
          blobDeleteSuccess = true;
          console.log(`Successfully deleted blob: ${blobName} from container: ${containerName}`);
        } else {
          console.warn(`Failed to delete from blob storage: ${blobName}`);
        }
      } catch (blobError) {
        console.error('Error deleting from blob storage:', blobError);
        showErrorToast(`Storage file could not be deleted: ${blobError.message}`);
      }

      // Show appropriate messages based on success/failure
      if (cosmosDeleteSuccess && blobDeleteSuccess) {
        showSuccessToast('File deleted successfully from both Cosmos DB and Blob Storage!');
      } else if (cosmosDeleteSuccess) {
        showSuccessToast('File record deleted from database, but the storage file could not be removed.');
      } else if (blobDeleteSuccess) {
        showSuccessToast('File deleted from storage, but the database record could not be removed.');
      } else {
        showErrorToast('Failed to delete file. Please try again.');
      }

      // Always refresh the list
      try {
        const items = await getMediaItemsByType(selectedMediaType);
        setFilteredMediaFiles(items);
      } catch (refreshError) {
        console.error('Error refreshing media list:', refreshError);
      }

      closeDeleteConfirmation();
    } catch (err) {
      console.error('General deletion error:', err);
      showErrorToast(`Failed to delete file: ${err.message}`);
      closeDeleteConfirmation();
    }
  };

  return (
    <ErrorBoundary>
      <div className={`container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <ToastManager position="top-right" />
        {loading && <Loading />}

        <ModernHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onUploadClick={toggleUploadForm}
        />

        <div className="header-actions">
          <button
            className="base64-demo-toggle"
            onClick={() => setShowBase64Demo(!showBase64Demo)}
          >
            {showBase64Demo ? 'Hide Base64 Demo' : 'Show Base64 Demo'}
          </button>
        </div>

        <>
          {showUploadForm && (
            <UploadForm
              onUpload={handleUpload}
              uploadProgress={uploadProgress}
              isUploading={loading}
            />
          )}

          {showBase64Demo && (
            <Base64Demo onUpload={handleUpload} />
          )}

          <MediaTypeFilter
            selectedType={selectedMediaType}
            onTypeChange={setSelectedMediaType}
          />

          <MediaGallery
            mediaFiles={filteredMediaFiles}
            onDelete={openDeleteConfirmation}
            isLoading={loading}
            error={error}
            darkMode={darkMode}
          />
        </>

        {/* Delete confirmation dialog */}
        <DeleteConfirmation
          isOpen={deleteConfirmation.isOpen}
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteConfirmation}
          fileName={deleteConfirmation.fileName}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App
