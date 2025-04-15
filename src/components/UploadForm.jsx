/**
 * Upload Form Component
 * Allows users to upload media files
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaFileUpload, FaMusic } from 'react-icons/fa';
import { useFileHandler } from '../hooks/useFileHandler';
import { useToast } from '../hooks/useToast';
import Placeholder from '../assets/placeholder.jpeg';
import { CONTAINER_CONFIG } from '../config/azure';

const UploadForm = ({ onUpload, uploadProgress, isUploading }) => {
  const { showErrorToast } = useToast();

  const {
    file,
    previewUrl,
    dragActive,
    fileError,
    handleFileInputChange,
    handleDrag,
    handleDrop,
    resetFile
  } = useFileHandler();

  // Show toast notification when file error occurs
  useEffect(() => {
    if (fileError) {
      showErrorToast(fileError);
    }
  }, [fileError, showErrorToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const success = await onUpload(file);
    if (success) {
      resetFile();
    }
  };

  return (
    <div className="row-form">
      <form
        className={`upload-form ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={(e) => handleDrag(e, 'dragenter')}
        onDragOver={(e) => handleDrag(e, 'dragover')}
        onDragLeave={(e) => handleDrag(e, 'dragleave')}
        onDrop={handleDrop}
      >
        <div className="upload-form_display">
          {file ? (
            <div className="media-preview-container">
              {file.type.startsWith('image/') && (
                <img
                  className="displayImg"
                  src={previewUrl}
                  alt="Preview of selected media file"
                />
              )}
              {file.type.startsWith('video/') && (
                <div className="video-preview-container">
                  {/* Simple video element with direct src attribute */}
                  <video
                    className="displayVideo"
                    src={previewUrl}
                    controls
                    playsInline
                    onError={(e) => {
                      console.error('Video error:', e.target.error);
                      // Add a fallback message if video fails to load
                      e.target.style.display = 'none';
                      const container = e.target.parentNode;
                      if (container && !container.querySelector('.video-error-message')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'video-error-message';
                        errorDiv.textContent = 'This video format may not be supported by your browser.';
                        container.appendChild(errorDiv);
                      }
                    }}
                    onLoadedData={() => {
                      console.log('Video loaded successfully:', file.name);
                      // Try to play the video automatically
                      const videoElement = document.querySelector('.displayVideo');
                      if (videoElement) {
                        // Start with sound on for preview
                        videoElement.muted = false;
                        videoElement.volume = 1.0;
                        videoElement.play().catch(err => {
                          console.log('Auto-play prevented:', err);
                          // If autoplay fails, try again with muted (browser policy)
                          videoElement.muted = true;
                          videoElement.play().then(() => {
                            // Try to unmute after a delay
                            setTimeout(() => {
                              videoElement.muted = false;
                            }, 1000);
                          }).catch(innerErr => {
                            console.log('Muted auto-play also prevented:', innerErr);
                          });
                        });
                      }
                    }}
                  />
                  <p className="video-preview-label">{file.name}</p>
                </div>
              )}
              {file.type.startsWith('audio/') && (
                <div className="audio-preview">
                  <div className="audio-preview-icon">
                    <FaMusic size={64} color="#007BFF" />
                  </div>

                  <div className="audio-wave-container playing">
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                    <div className="audio-wave-bar"></div>
                  </div>

                  <audio
                    className="displayAudio"
                    src={previewUrl}
                    controls
                    autoPlay
                    onLoadedData={() => {
                      console.log('Audio loaded successfully:', file.name);
                      // Try to play the audio automatically
                      const audioElement = document.querySelector('.displayAudio');
                      if (audioElement) {
                        // Start with sound on for preview
                        audioElement.volume = 1.0;
                        audioElement.play().catch(err => {
                          console.log('Audio auto-play prevented:', err);
                          // If autoplay fails, try muted autoplay
                          audioElement.muted = true;
                          audioElement.play().catch(innerErr => {
                            console.log('Muted auto-play also prevented:', innerErr);
                            // If that fails too, update the wave animation
                            const waveContainer = document.querySelector('.audio-wave-container');
                            if (waveContainer) {
                              waveContainer.classList.remove('playing');
                            }
                          });
                        });
                      }
                    }}
                    onPlay={() => {
                      const waveContainer = document.querySelector('.audio-wave-container');
                      if (waveContainer) {
                        waveContainer.classList.add('playing');
                      }
                    }}
                    onPause={() => {
                      const waveContainer = document.querySelector('.audio-wave-container');
                      if (waveContainer) {
                        waveContainer.classList.remove('playing');
                      }
                    }}
                  />
                  <p className="audio-filename">{file.name}</p>
                </div>
              )}
              {fileError && (
                <div className="file-error">{fileError}</div>
              )}
            </div>
          ) : (
            <>
              <img
                className="displayImg"
                src={Placeholder}
                alt="Upload placeholder - shows a mountain landscape"
              />
              <div className="upload-instruction">
                <span className="upload-instruction-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.59 9H15V4C15 3.45 14.55 3 14 3H10C9.45 3 9 3.45 9 4V9H7.41C6.52 9 6.07 10.08 6.7 10.71L11.29 15.3C11.68 15.69 12.31 15.69 12.7 15.3L17.29 10.71C17.92 10.08 17.48 9 16.59 9ZM5 19C5 19.55 5.45 20 6 20H18C18.55 20 19 19.55 19 19C19 18.45 18.55 18 18 18H6C5.45 18 5 18.45 5 19Z" fill="currentColor"/>
                  </svg>
                </span>
                <div className="upload-instruction-text">Drag & Drop Media Here</div>
                <div className="upload-instruction-subtext">
                  Supports images, videos, and audio files
                  <br />
                  <small>Max size: 100MB for videos, 20MB for other files</small>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="upload-form_inputs">
          <label htmlFor="fileInput" aria-label="Upload media file">
            <FaFileUpload />
            <span>Select Media Files</span>
          </label>
          <p className="upload-tooltip">
            Click to browse for images, videos, or audio files
          </p>
          <input
            type="file"
            style={{ display: "none" }}
            id="fileInput"
            onChange={handleFileInputChange}
            accept={Object.values(CONTAINER_CONFIG)
              .flatMap(config => config.allowedTypes)
              .join(',')}
          />

          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className="upload-progress-text">{uploadProgress}%</span>
            </div>
          )}

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className={isUploading ? 'uploading' : ''}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
};

UploadForm.propTypes = {
  onUpload: PropTypes.func.isRequired,
  uploadProgress: PropTypes.number,
  isUploading: PropTypes.bool
};

UploadForm.defaultProps = {
  uploadProgress: 0,
  isUploading: false
};

export default UploadForm;
