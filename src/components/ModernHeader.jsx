/**
 * Modern App Header Component
 * Displays a modern, stylish application header with logo and theme toggle
 */

import PropTypes from 'prop-types';
import { Upload, Image } from 'lucide-react';

const ModernHeader = ({ darkMode, toggleDarkMode, onUploadClick }) => {
  return (
    <div className="modern-header">
      <div className="header-left">
        <div className="header-icon-container">
          <Image className="header-icon" />
        </div>
        <div className="header-text">
          <h1 className="header-title">
            Media Gallery
          </h1>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="upload-button"
          onClick={onUploadClick}
          aria-label="Upload new media"
        >
          <Upload className="upload-icon" />
          <span>Upload</span>
        </button>

        <label className="theme-toggle-container">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleDarkMode}
            className="theme-toggle-input"
          />
          <div className="theme-toggle-track">
            <span className="theme-toggle-thumb"></span>
          </div>
        </label>
      </div>
    </div>
  );
};

ModernHeader.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func.isRequired
};

export default ModernHeader;
