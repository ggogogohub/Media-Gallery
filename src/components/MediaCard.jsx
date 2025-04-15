/**
 * Media Card Component
 * Displays a media item (image, audio, or video) in a card format
 */

import PropTypes from 'prop-types';
// Import delete icon
import deleteIcon from '../assets/delete.png';
import VideoPlayer from './VideoPlayer';
import { FaMusic, FaPlay } from 'react-icons/fa';
import {
  getFileNameWithoutExtension,
  getFileIcon,
  formatDate
} from '../utils/fileUtils';

const MediaCard = ({ item, onDelete, onPreview }) => {
  // Get file name without extension and limit to 20 characters with ellipsis if longer
  const fileName = getFileNameWithoutExtension(item.name);

  // Render different card layouts based on media type
  const renderImageCard = () => (
    <div className="card image-card" data-type="images">
      <div className="file-type-indicator">
        {getFileIcon('images')}
      </div>

      <div className="card-media-wrapper" onClick={() => onPreview(item)}>
        <div className="card-media-container">
          <img
            src={item.url}
            alt={`Image: ${fileName}`}
            loading="lazy"
          />
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" title={fileName}>
          {fileName}
        </h3>
      </div>

      <div className="card-footer">
        <span className="card-timestamp">
          {formatDate(item.createdOn)}
        </span>
      </div>

      <button
        className="del"
        onClick={() => onDelete(item.name, item.containerName)}
        aria-label={`Delete ${fileName}`}
      >
        <img src={deleteIcon} alt="Delete" className="delete-icon" />
      </button>
    </div>
  );

  const renderAudioCard = () => (
    <div className="card audio-card" data-type="audio">
      <div className="file-type-indicator">
        {getFileIcon('audio')}
      </div>

      <div className="card-media-wrapper" onClick={() => onPreview(item)}>
        <div className="card-media-container audio-thumbnail">
          <div className="audio-icon">
            <FaMusic size={36} />
          </div>
          <div className="audio-play-indicator">
            <FaPlay size={16} />
          </div>
        </div>
      </div>

      <div className="card-content audio-content">
        <h3 className="card-title" title={fileName}>
          {fileName}
        </h3>
      </div>

      <div className="audio-controls">
        <audio controls src={item.url} />
      </div>

      <div className="card-footer audio-footer">
        <span className="card-timestamp">
          {formatDate(item.createdOn)}
        </span>
      </div>

      <button
        className="del"
        onClick={() => onDelete(item.name, item.containerName)}
        aria-label={`Delete ${fileName}`}
      >
        <img src={deleteIcon} alt="Delete" className="delete-icon" />
      </button>
    </div>
  );

  const renderVideoCard = () => (
    <div className="card video-card" data-type="video">
      <div className="file-type-indicator">
        {getFileIcon('video')}
      </div>

      <div className="card-media-wrapper" onClick={() => onPreview(item)}>
        <VideoPlayer
          className="card-video"
          src={item.url}
          isPreview={false}
        />
      </div>

      <div className="card-content video-content">
        <h3 className="card-title" title={fileName}>
          {fileName}
        </h3>
      </div>

      <div className="card-footer video-footer">
        <span className="card-timestamp">
          {formatDate(item.createdOn)}
        </span>
      </div>

      <button
        className="del"
        onClick={() => onDelete(item.name, item.containerName)}
        aria-label={`Delete ${fileName}`}
      >
        <img src={deleteIcon} alt="Delete" className="delete-icon" />
      </button>
    </div>
  );

  // Return the appropriate card based on media type
  switch(item.type) {
    case 'images':
      return renderImageCard();
    case 'audio':
      return renderAudioCard();
    case 'video':
      return renderVideoCard();
    default:
      return null;
  }
};

MediaCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    containerName: PropTypes.string.isRequired,
    createdOn: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func
};

MediaCard.defaultProps = {
  onPreview: () => {}
};

export default MediaCard;
