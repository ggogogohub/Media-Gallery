import PropTypes from 'prop-types';
import { FaImage, FaMusic, FaVideo, FaThList } from 'react-icons/fa';

const MediaTypeFilter = ({ selectedType, onTypeChange }) => {
  const filterTypes = [
    { type: 'all', label: 'All', icon: FaThList },
    { type: 'image', label: 'Images', icon: FaImage },
    { type: 'audio', label: 'Audio', icon: FaMusic },
    { type: 'video', label: 'Video', icon: FaVideo }
  ];

  return (
    <div className="media-type-filter">
      {filterTypes.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          className={`filter-button ${selectedType === type ? 'active' : ''}`}
          onClick={() => onTypeChange(type)}
          aria-label={`Filter by ${label}`}
        >
          <Icon className="filter-icon" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

MediaTypeFilter.propTypes = {
  selectedType: PropTypes.oneOf(['all', 'image', 'audio', 'video']).isRequired,
  onTypeChange: PropTypes.func.isRequired
};

export default MediaTypeFilter; 