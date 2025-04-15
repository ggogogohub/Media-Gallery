/**
 * Modern Media Card Component
 * Displays a media item (image, audio, or video) in a modern card format
 */

import PropTypes from 'prop-types';
import { formatDate, detectBase64Image } from '../utils/fileUtils';
import { FaMusic, FaPlay, FaImage, FaVideo, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const NewMediaCard = ({ item, onDelete, onPreview, darkMode }) => {
  // Get file name without extension
  const getFileName = (name) => {
    if (!name) return 'Untitled';

    // Remove timestamp prefix if it exists
    const nameWithoutTimestamp = name.includes('-')
      ? name.substring(name.indexOf('-') + 1)
      : name;

    const dotIndex = nameWithoutTimestamp.lastIndexOf('.');
    const baseName = dotIndex !== -1
      ? nameWithoutTimestamp.slice(0, dotIndex)
      : nameWithoutTimestamp;

    // Truncate long filenames for display
    return baseName.length > 20 ? baseName.substring(0, 20) + '...' : baseName;
  };

  // Log the item data to help debug issues
  console.log('NewMediaCard item:', item);

  // Ensure item has all required properties with fallbacks
  const safeItem = {
    id: item.id || `id-${Date.now()}`,
    name: item.fileName || item.name || 'unknown-file',
    url: item.blobUrl || item.url || '',
    type: item.mediaType || item.type || 'image',
    containerName: item.containerName || 'images',
    blobName: item.blobName || item.fileName || item.name || 'unknown-file',
    createdOn: item.uploadDate || item.createdOn || new Date().toISOString(),
    contentType: item.contentType || '' // Add contentType property
  };

  const fileName = getFileName(safeItem.name);

  // Normalize the media type for container naming
  let mediaType = safeItem.type;

  // Handle cases where mediaType might be 'images' instead of 'image'
  if (mediaType === 'images') mediaType = 'image';

  // Make sure containerName aligns with the mediaType
  // This ensures we're passing the right parameters to the delete function
  const containerMap = {
    'image': 'images',
    'audio': 'audio',
    'video': 'videos'
  };

  const containerName = safeItem.containerName || containerMap[mediaType] || 'images';

  // Check if we have a valid URL or base64 data
  const { isBase64, mediaType: base64MediaType } = detectBase64Image(safeItem.url);
  const hasValidUrl = safeItem.url && safeItem.url.length > 0;

  // If we have base64 data, override the mediaType
  if (isBase64 && base64MediaType) {
    mediaType = base64MediaType;
  }

  // Function to fix blob URLs if needed
  const fixBlobUrl = (url) => {
    if (!url) return '';

    // If it's a base64 image, return as is
    if (url.startsWith('data:')) {
      return url;
    }

    // Check if this is a blob URL without proper SAS token
    if (url.includes('blob.core.windows.net') && !url.includes('?')) {
      // Try to add a sas query parameter
      console.log('URL may need SAS token:', url);
    }

    // Return as is for now
    return url;
  };

  const imageUrl = fixBlobUrl(safeItem.url);

  return (
    <div className={`modern-card ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="media-container" onClick={() => onPreview(safeItem)}>
        {/* Use contentType for more precise media type detection */}
        {(safeItem.contentType?.startsWith('image/') || isBase64 || mediaType === 'image') ? (
          isBase64 ? (
            // Handle base64 image
            <img
              src={imageUrl}
              alt={fileName}
              className="media-image"
              loading="lazy"
              onError={(e) => {
                console.error(`Error loading base64 image`);
                e.target.onerror = null; // Prevent infinite error loop
                e.target.src = '/not-found.png'; // Local fallback image
              }}
            />
          ) : hasValidUrl ? (
            // Handle regular image URL
            <img
              src={imageUrl}
              alt={fileName}
              className="media-image"
              loading="lazy"
              onError={(e) => {
                console.error(`Error loading image: ${imageUrl}`);
                e.target.onerror = null; // Prevent infinite error loop
                e.target.src = '/not-found.png'; // Local fallback image
              }}
            />
          ) : (
            // Fallback for no URL
            <div className="fallback-container">
              <FaImage className="fallback-icon" />
            </div>
          )
        ) : null}

        {(safeItem.contentType?.startsWith('audio/') || mediaType === 'audio') && (
          <div className="audio-container">
            <FaMusic className="audio-icon" size={70} />
            <div className="play-overlay">
              <FaPlay />
            </div>
          </div>
        )}

        {(safeItem.contentType?.startsWith('video/') || mediaType === 'video') ? (
          hasValidUrl ? (
            <>
              <video className="media-video">
                <source src={fixBlobUrl(safeItem.url)} type={safeItem.contentType || "video/mp4"} />
                Your browser does not support the video tag.
              </video>
              <div className="play-overlay">
                <FaPlay />
              </div>
            </>
          ) : (
            <div className="fallback-container">
              <FaVideo className="fallback-icon" />
            </div>
          )
        ) : null}

        {/* Fallback for unsupported file types */}
        {!safeItem.contentType && !['image', 'audio', 'video'].includes(mediaType) && (
          <div className="fallback-container">
            <FaExclamationTriangle className="fallback-icon" />
          </div>
        )}
      </div>

      <div className="card-info">
        <h3 className="card-title" title={fileName}>{fileName}</h3>
        <p className="card-date">{formatDate(safeItem.createdOn)}</p>
      </div>

      <button
        className="delete-button"
        onClick={(e) => {
          e.stopPropagation();
          // Always use the exact blobName and containerName from the item
          const deleteId = safeItem.blobName;
          // Use the actual containerName from the item, not the derived one
          const actualContainer = safeItem.containerName;
          console.log(`Deleting: ${deleteId}, container: ${actualContainer}, type: ${mediaType}`);
          onDelete(deleteId, actualContainer, mediaType);
        }}
        aria-label={`Delete ${fileName}`}
      >
        <FaTrash className="delete-icon" />
      </button>
    </div>
  );
};

NewMediaCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    fileName: PropTypes.string,
    blobName: PropTypes.string,
    url: PropTypes.string,
    blobUrl: PropTypes.string,
    type: PropTypes.string,
    mediaType: PropTypes.string,
    containerName: PropTypes.string,
    createdOn: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    uploadDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  darkMode: PropTypes.bool
};

NewMediaCard.defaultProps = {
  darkMode: false
};

export default NewMediaCard;
