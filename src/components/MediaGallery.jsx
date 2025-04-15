/**
 * Media Gallery Component
 * Displays a grid of media cards
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import NewMediaCard from './NewMediaCard';
import EnhancedMediaPreview from './EnhancedMediaPreview';

const MediaGallery = ({ mediaFiles, onDelete, isLoading, error, darkMode }) => {
  const [previewItem, setPreviewItem] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [validMediaFiles, setValidMediaFiles] = useState([]);

  // Validate media files to ensure they have the required properties
  useEffect(() => {
    if (!mediaFiles || !Array.isArray(mediaFiles)) {
      setValidMediaFiles([]);
      return;
    }

    // Filter out items without essential properties
    const validItems = mediaFiles.filter(item =>
      item && typeof item === 'object'
    );

    // Deduplicate items - using a Map with file name as key
    const uniqueItems = new Map();
    validItems.forEach(item => {
      const fileName = item.fileName || item.name || '';
      const blobUrl = item.blobUrl || item.url || '';

      // Skip empty items
      if (!fileName && !blobUrl) return;

      // Create a key to identify duplicates
      const key = fileName || blobUrl;

      // Only add if we don't have this item yet, or if we have a better version
      // (e.g., one with a URL when the existing one doesn't have one)
      if (!uniqueItems.has(key) ||
          (!uniqueItems.get(key).url && blobUrl) ||
          (!uniqueItems.get(key).blobUrl && item.blobUrl)) {
        uniqueItems.set(key, item);
      }
    });

    // Convert Map values back to array
    const deduplicatedItems = Array.from(uniqueItems.values());

    console.log(`MediaGallery: Received ${mediaFiles.length} items, ${validItems.length} valid, ${deduplicatedItems.length} unique`);
    setValidMediaFiles(deduplicatedItems);
  }, [mediaFiles]);

  const handlePreview = (item) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className="row-display error-state">
        <div className="empty-state">
          <h3>Error Loading Media</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Don't show separate loading state in MediaGallery
  // The main Loading component will handle this
  if (isLoading) {
    return null;
  }

  // Show empty state
  if (!validMediaFiles || validMediaFiles.length === 0) {
    return (
      <div className="row-display empty-state">
        <div className="empty-gallery">
          <div className="empty-icon">📁</div>
          <h3>No Media Files Found</h3>
          <p>Upload your first media file to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="modern-grid">
        {validMediaFiles.map((item, index) => (
          <NewMediaCard
            key={item.id || `media-item-${index}`}
            item={item}
            onDelete={onDelete}
            onPreview={handlePreview}
            darkMode={darkMode}
          />
        ))}
      </div>

      <EnhancedMediaPreview
        isOpen={isPreviewOpen}
        onClose={closePreview}
        currentItem={previewItem}
        mediaFiles={validMediaFiles}
      />
    </>
  );
};

MediaGallery.propTypes = {
  mediaFiles: PropTypes.arrayOf(PropTypes.object),
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  darkMode: PropTypes.bool
};

MediaGallery.defaultProps = {
  isLoading: false,
  error: null,
  mediaFiles: [],
  darkMode: false
};

export default MediaGallery;
