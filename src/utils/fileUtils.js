/**
 * File utility functions
 */

/**
 * Get file type based on MIME type or URL
 * @param {string} mimeTypeOrUrl - MIME type of the file or URL/data URI
 * @returns {string|null} - File type (images, audio, video) or null if unsupported
 */
export const getFileType = (mimeTypeOrUrl) => {
  if (!mimeTypeOrUrl) return null;

  // Check if it's a base64 data URI for an image
  if (typeof mimeTypeOrUrl === 'string' &&
      (mimeTypeOrUrl.startsWith('data:image/') ||
       mimeTypeOrUrl.startsWith('data:application/octet-stream;base64'))) {
    return 'images';
  }

  if (mimeTypeOrUrl.startsWith('image/')) return 'images';
  if (mimeTypeOrUrl.startsWith('audio/')) return 'audio';
  if (mimeTypeOrUrl.startsWith('video/')) return 'video';
  return null;
};

/**
 * Get file icon emoji based on file type
 * @param {string} type - File type (images, audio, video)
 * @returns {string} - Icon emoji
 */
export const getFileIcon = (type) => {
  switch (type) {
    case 'images':
      return '🏞️';
    case 'audio':
      return '🎵';
    case 'video':
      return '🎬';
    default:
      return '📄';
  }
};

/**
 * Get file name without extension
 * @param {string} filename - File name
 * @returns {string} - File name without extension
 */
export const getFileNameWithoutExtension = (filename) => {
  if (!filename) return '';

  // Remove timestamp prefix if it exists (e.g., 1623456789-filename.jpg)
  const nameWithoutTimestamp = filename.includes('-')
    ? filename.substring(filename.indexOf('-') + 1)
    : filename;

  const dotIndex = nameWithoutTimestamp.lastIndexOf('.');
  const baseName = dotIndex !== -1
    ? nameWithoutTimestamp.slice(0, dotIndex)
    : nameWithoutTimestamp;

  // Truncate long filenames for display
  return baseName.length > 20 ? baseName.substring(0, 20) + '...' : baseName;
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date in human-readable format
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} - Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';

  try {
    // Handle both Date objects and ISO strings
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return '';
    }

    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Detect if a string is a base64 encoded image and return its type
 * @param {string} str - String to check
 * @returns {Object} - Object with isBase64 and mediaType properties
 */
export const detectBase64Image = (str) => {
  if (!str || typeof str !== 'string') {
    return { isBase64: false, mediaType: null };
  }

  // Check if it's a data URI
  if (str.startsWith('data:')) {
    // Extract the MIME type
    const matches = str.match(/^data:([\w\/+]+);base64,/);
    if (matches && matches.length > 1) {
      const mimeType = matches[1];
      if (mimeType.startsWith('image/')) {
        return { isBase64: true, mediaType: 'image' };
      }
      if (mimeType.startsWith('audio/')) {
        return { isBase64: true, mediaType: 'audio' };
      }
      if (mimeType.startsWith('video/')) {
        return { isBase64: true, mediaType: 'video' };
      }
      // For application/octet-stream, try to determine by examining the data
      if (mimeType === 'application/octet-stream') {
        // Most likely an image if it's base64 data
        return { isBase64: true, mediaType: 'image' };
      }
    }

    // If we have a data URI but couldn't determine the type, assume it's an image
    if (str.includes('base64,')) {
      return { isBase64: true, mediaType: 'image' };
    }
  }

  return { isBase64: false, mediaType: null };
};

/**
 * Convert a base64 string to a File object
 * @param {string} base64String - Base64 string to convert (with or without data URI prefix)
 * @param {string} filename - Filename to use for the File object
 * @returns {File|null} - File object or null if conversion fails
 */
export const base64ToFile = (base64String, filename = 'base64_image.png') => {
  if (!base64String || typeof base64String !== 'string') {
    console.error('Invalid base64 string: string is empty or not a string');
    return null;
  }

  try {
    let mimeType = 'image/png'; // Default MIME type
    let base64Data = base64String;

    // Handle data URI format
    if (base64String.startsWith('data:')) {
      // Extract the MIME type
      const matches = base64String.match(/^data:([\w\/+]+);base64,/);
      if (!matches || matches.length !== 2) {
        console.error('Could not extract MIME type from data URI');
        return null;
      }

      mimeType = matches[1];
      console.log('Extracted MIME type:', mimeType);

      // Extract the base64 data part
      const parts = base64String.split(',');
      if (parts.length !== 2) {
        console.error('Invalid data URI format: missing data part');
        return null;
      }

      base64Data = parts[1];
    }

    console.log('Base64 data length:', base64Data.length);

    // Validate base64 data
    if (base64Data.length === 0) {
      console.error('Empty base64 data');
      return null;
    }

    // Get the file extension from the MIME type
    let extension = 'bin';
    if (mimeType.startsWith('image/')) {
      extension = mimeType.split('/')[1];
    }

    // Add extension to filename if it doesn't have one
    if (!filename.includes('.')) {
      filename = `${filename}.${extension}`;
    }
    console.log('Using filename:', filename);

    try {
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create a Blob and then a File
      const blob = new Blob([bytes], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });
      console.log('Successfully created File object:', file.name, file.type, file.size);
      return file;
    } catch (error) {
      console.error('Error decoding base64 data:', error);
      return null;
    }
  } catch (error) {
    console.error('Error converting base64 to File:', error);
    return null;
  }
};