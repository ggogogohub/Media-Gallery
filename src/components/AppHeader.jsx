/**
 * App Header Component
 * Displays the application header with logo and theme toggle
 */

import PropTypes from 'prop-types';
import { FaMoon, FaSun, FaCloud, FaCloudUploadAlt } from 'react-icons/fa';

const AppHeader = ({ darkMode, toggleDarkMode, onUploadClick }) => {
  return (
    <header className="app-header">
      <div className="header-logo-container">
        <div className="logo-icon-wrapper">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z" fill="currentColor"/>
            <path d="M7 10C8.10457 10 9 9.10457 9 8C9 6.89543 8.10457 6 7 6C5.89543 6 5 6.89543 5 8C5 9.10457 5.89543 10 7 10Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="header-content">
          <h2 className="app-title">Media Gallery</h2>
          <div className="tagline-container">
            <FaCloud className="tagline-icon" />
            <p className="tagline">Azure Blob Storage</p>
          </div>
        </div>
      </div>
      <div className="header-actions">
        <button
          className="upload-button"
          onClick={onUploadClick}
          aria-label="Upload new media"
        >
          <FaCloudUploadAlt className="upload-icon" />
          <span>Upload</span>
        </button>
        <button
          className="theme-toggle"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <FaSun className="theme-icon" /> : <FaMoon className="theme-icon" />}
        </button>
      </div>
    </header>
  );
};

AppHeader.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func
};

AppHeader.defaultProps = {
  onUploadClick: () => {}
};

export default AppHeader;
