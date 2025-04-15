/**
 * Custom hook for file handling
 */

import { useState, useCallback, useEffect } from 'react';
import { getFileType } from '../utils/fileUtils';
import { CONTAINER_CONFIG } from '../config/azure';

/**
 * Custom hook for file handling
 * @returns {Object} File handling operations and state
 */
export const useFileHandler = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);

  /**
   * Handle file selection
   * @param {File} selectedFile - Selected file
   * @returns {boolean} - True if file is valid
   */
  const handleFileSelection = useCallback((selectedFile) => {
    if (!selectedFile) {
      setFileError('No file selected');
      setFile(null);
      setPreviewUrl(null);
      return false;
    }

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const fileType = getFileType(selectedFile.type);
    const containerConfig = CONTAINER_CONFIG[fileType];

    if (!containerConfig) {
      setFileError(`Unsupported file type: ${selectedFile.type}. Please upload an image, video, or audio file.`);
      setFile(null);
      setPreviewUrl(null);
      return false;
    }

    if (!containerConfig.allowedTypes.includes(selectedFile.type)) {
      // Create a more detailed error message with supported formats
      const supportedFormats = containerConfig.allowedTypes
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');

      setFileError(`This ${fileType} format (${selectedFile.type.split('/')[1]}) is not supported. Supported formats: ${supportedFormats}`);
      setFile(null);
      setPreviewUrl(null);
      return false;
    }

    // File size validation (100MB limit for videos, 20MB for other files)
    let MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB default

    // For video files, allow up to 100MB
    if (selectedFile.type.startsWith('video/')) {
      MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for videos
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeInMB = Math.round(selectedFile.size / (1024 * 1024));
      const limitInMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      setFileError(`File size (${sizeInMB}MB) exceeds the ${limitInMB}MB limit for ${fileType} files. Please upload a smaller file.`);
      setFile(null);
      setPreviewUrl(null);
      return false;
    }

    // Create preview URL
    try {
      // Revoke any previous object URL to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(selectedFile);
      console.log('Created preview URL:', url, 'for file:', selectedFile);

      // For video files, check if the format is supported
      if (selectedFile.type.startsWith('video/')) {
        console.log('Video format:', selectedFile.type);

        // Some browsers might not support all video formats
        // Common supported formats: MP4 (H.264), WebM, Ogg
        if (!selectedFile.type.includes('mp4') &&
          !selectedFile.type.includes('webm') &&
          !selectedFile.type.includes('ogg')) {
          console.warn('Video format may not be supported by all browsers:', selectedFile.type);
        }
      }

      setPreviewUrl(url);
      setFile(selectedFile);
      setFileError(null);
      return true;
    } catch (error) {
      console.error('Error creating preview URL:', error);
      setFileError(`Failed to create preview for ${selectedFile.name}. The file may be corrupted or the format may not be supported by your browser.`);
      setFile(null);
      setPreviewUrl(null);
      return false;
    }
  }, [previewUrl]);

  /**
   * Handle file input change
   * @param {Event} e - File input change event
   */
  const handleFileInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    handleFileSelection(selectedFile);
  }, [handleFileSelection]);

  /**
   * Handle drag events
   * @param {Event} e - Drag event
   * @param {string} type - Event type
   */
  const handleDrag = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();

    if (type === 'dragenter' || type === 'dragover') {
      setDragActive(true);
    } else if (type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  /**
   * Handle drop event
   * @param {Event} e - Drop event
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);

  /**
   * Reset file state
   */
  const resetFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
  }, [previewUrl]);

  // Cleanup effect to revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        console.log('Cleaning up preview URL:', previewUrl);
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    dragActive,
    fileError,
    handleFileInputChange,
    handleDrag,
    handleDrop,
    resetFile,
    handleFileSelection
  };
};
