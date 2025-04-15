/**
 * Enhanced Media Preview Component
 * Displays a modern, stylish full-screen preview of media files with improved controls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
// Import modern Lucide React icons
import {
  XCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Square,
  Minimize2,
  Music,
  Info,
  SkipBack,
  SkipForward
} from 'lucide-react';

// Fallback icons from React Icons
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaInfoCircle,
  FaStepBackward,
  FaStepForward
} from 'react-icons/fa';
import { getFileNameWithoutExtension, detectBase64Image } from '../utils/fileUtils';
import '../styles/enhancedMediaPreview.css';
import '../styles/unifiedMediaControls.css';

const EnhancedMediaPreview = ({ isOpen, onClose, currentItem, mediaFiles }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const mediaRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Navigation functions
  const navigateNext = useCallback(() => {
    if (mediaFiles.length <= 1) return;
    setCurrentIndex(prevIndex => (prevIndex + 1) % mediaFiles.length);
    setIsMediaLoaded(false);
  }, [mediaFiles.length]);

  const navigatePrev = useCallback(() => {
    if (mediaFiles.length <= 1) return;
    setCurrentIndex(prevIndex => (prevIndex - 1 + mediaFiles.length) % mediaFiles.length);
    setIsMediaLoaded(false);
  }, [mediaFiles.length]);

  // Toggle play/pause for video and audio
  const togglePlay = useCallback(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play().catch(err => {
          console.error('Play failed:', err);
        });
      }
    }
  }, [isPlaying]);

  // Toggle mute for video and audio
  const toggleMute = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Find the index of the current item in the mediaFiles array
  useEffect(() => {
    if (currentItem && mediaFiles.length > 0) {
      console.log('Current preview item:', currentItem);
      console.log('Available media files:', mediaFiles);
      // Try to match by multiple properties since structure can vary
      const index = mediaFiles.findIndex(item =>
        (item.id && currentItem.id && item.id === currentItem.id) ||
        (item.name && currentItem.name && item.name === currentItem.name) ||
        (item.blobName && currentItem.blobName && item.blobName === currentItem.blobName) ||
        (item.fileName && currentItem.fileName && item.fileName === currentItem.fileName) ||
        (item.url && currentItem.url && item.url === currentItem.url)
      );

      if (index !== -1) {
        console.log(`Found item at index ${index}`);
        setCurrentIndex(index);
        setIsMediaLoaded(false);
      } else {
        console.warn('Could not find current item in media files array');
      }
    }
  }, [currentItem, mediaFiles]);

  // Auto-play when media is loaded
  useEffect(() => {
    if (isMediaLoaded && mediaRef.current && (currentItem?.type === 'video' || currentItem?.type === 'audio')) {
      // Always try to play immediately when media is loaded
      console.log('Attempting to auto-play media');

      // First try to play with sound
      mediaRef.current.play().then(() => {
        setIsPlaying(true);
        console.log('Auto-play successful with sound');
      }).catch(err => {
        console.error('Auto-play with sound failed:', err);

        // If that fails, try muted autoplay (browser policy often requires this)
        if (!isMuted) {
          console.log('Trying muted autoplay...');
          mediaRef.current.muted = true;
          setIsMuted(true);

          mediaRef.current.play().then(() => {
            setIsPlaying(true);
            console.log('Muted auto-play successful');
          }).catch(innerErr => {
            console.error('Muted auto-play also failed:', innerErr);
            setIsPlaying(false);
          });
        } else {
          setIsPlaying(false);
        }
      });
    }
  }, [isMediaLoaded, currentItem, isMuted]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          navigatePrev();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
        case ' ': // Space bar
          if (currentItem?.type === 'video' || currentItem?.type === 'audio') {
            togglePlay();
            e.preventDefault(); // Prevent page scroll
          }
          break;
        case 'm': // Mute/unmute
          if (currentItem?.type === 'video' || currentItem?.type === 'audio') {
            toggleMute();
          }
          break;
        case 'f': // Fullscreen
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, mediaFiles.length, navigateNext, navigatePrev, onClose, togglePlay, toggleMute, toggleFullscreen, currentItem]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!isOpen || !(currentItem?.type === 'video' || currentItem?.type === 'audio')) return;

    const handleMouseMove = () => {
      setIsControlsVisible(true);

      // Clear existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      // Set new timeout
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setIsControlsVisible(false);
        }
      }, 3000);
    };

    // Show controls when paused
    if (!isPlaying) {
      setIsControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, isPlaying, currentItem]);

  // Update progress bar
  const updateProgress = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
      setDuration(mediaRef.current.duration);
    }
  };

  // Seek to position in media
  const seek = (e) => {
    const progressBar = e.currentTarget;
    const clickPosition = (e.pageX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    const newTime = clickPosition * duration;

    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Change volume
  const changeVolume = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  // Handle media events
  const handleMediaPlay = () => setIsPlaying(true);
  const handleMediaPause = () => setIsPlaying(false);
  const handleMediaVolumeChange = (e) => {
    setIsMuted(e.target.muted);
    setVolume(e.target.muted ? 0 : e.target.volume);
  };
  const handleMediaTimeUpdate = () => updateProgress();
  const handleMediaLoadedMetadata = () => {
    updateProgress();
    setIsMediaLoaded(true);
  };
  const handleMediaLoadedData = () => {
    setIsMediaLoaded(true);
  };

  if (!isOpen || !currentItem || mediaFiles.length === 0) return null;

  const currentMedia = mediaFiles[currentIndex];

  // Fix function to get the proper URL from either structure
  const getItemUrl = (item) => {
    if (!item) return '';

    // Get the URL from the item
    const url = item.blobUrl || item.url || '';

    // If it's a base64 image, it's already valid
    if (url.startsWith('data:')) {
      return url;
    }

    return url;
  };

  // Helper to get the correct media type
  const getMediaType = (item) => {
    if (!item) return 'unknown';

    // First check contentType if available (most reliable)
    if (item.contentType) {
      if (item.contentType.startsWith('image/')) return 'image';
      if (item.contentType.startsWith('audio/')) return 'audio';
      if (item.contentType.startsWith('video/')) return 'video';
    }

    // Check if the URL is a base64 image
    const url = item.blobUrl || item.url || '';
    const { isBase64, mediaType: base64MediaType } = detectBase64Image(url);

    if (isBase64 && base64MediaType) {
      return base64MediaType;
    }

    // Fall back to mediaType or type
    return item.mediaType || item.type || 'unknown';
  };

  const renderMedia = () => {
    if (!mediaFiles.length || currentIndex >= mediaFiles.length) return null;

    const currentMedia = mediaFiles[currentIndex];
    console.log('Rendering media:', currentMedia);
    const mediaType = getMediaType(currentMedia);
    const mediaUrl = getItemUrl(currentMedia);

    // Get filename for display
    const filename = currentMedia.fileName || currentMedia.name || 'Unknown File';
    const displayName = getFileNameWithoutExtension(filename);

    // Check if we have a valid URL
    if (!mediaUrl) {
      console.warn('No URL available for media item:', currentMedia);
      return (
        <div className="media-error">
          <FaTimes className="error-icon" />
          <p>Media URL not available</p>
        </div>
      );
    }

    switch (mediaType) {
      case 'image':
        return (
          <div className="image-preview-wrapper">
            {!isMediaLoaded && (
              <div className="media-loading-placeholder">
                <div className="loading-spinner"></div>
                <p>Loading image...</p>
              </div>
            )}
            <img
              src={mediaUrl}
              alt={displayName}
              className="preview-image"
              onLoad={() => setIsMediaLoaded(true)}
              onError={(e) => {
                console.error('Error loading image:', mediaUrl);
                setIsMediaLoaded(false);
                e.target.onerror = null; // Prevent infinite error loop
                e.target.src = '/not-found.png'; // Local fallback image
              }}
            />
          </div>
        );
      case 'video':
        return (
          <div className="video-preview-wrapper">
            {!isMediaLoaded && (
              <div className="media-loading-placeholder">
                <div className="loading-spinner"></div>
                <p>Loading video...</p>
              </div>
            )}
            <video
              ref={mediaRef}
              src={mediaUrl}
              className="preview-video"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              onPlay={handleMediaPlay}
              onPause={handleMediaPause}
              onVolumeChange={handleMediaVolumeChange}
              onTimeUpdate={handleMediaTimeUpdate}
              onLoadedMetadata={handleMediaLoadedMetadata}
              onLoadedData={handleMediaLoadedData}
              onError={(e) => {
                console.error('Error loading video:', e);
                setIsMediaLoaded(false);
              }}
              playsInline
              autoPlay
              type={currentMedia.contentType || 'video/mp4'}
            />
            <div className="video-overlay-controls" onClick={togglePlay}>
              <div className="video-play-indicator">
                {isPlaying ? (
                  <Pause size={40} className="lucide-icon" />
                ) : (
                  <Play size={40} className="lucide-icon" />
                )}
              </div>
              <div className="video-time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="audio-preview-container">
            {!isMediaLoaded && (
              <div className="media-loading-placeholder">
                <div className="loading-spinner"></div>
                <p>Loading audio...</p>
              </div>
            )}
            <div className="audio-visualization">
              <Music size={80} className="audio-icon" />
              {isPlaying && (
                <div className="audio-wave-animation">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.15}s` }}></div>
                  ))}
                </div>
              )}

            </div>
            <audio
              ref={mediaRef}
              src={mediaUrl}
              className="preview-audio"
              onPlay={handleMediaPlay}
              onPause={handleMediaPause}
              onVolumeChange={handleMediaVolumeChange}
              onTimeUpdate={handleMediaTimeUpdate}
              onLoadedMetadata={handleMediaLoadedMetadata}
              onLoadedData={handleMediaLoadedData}
              onError={(e) => {
                console.error('Error loading audio:', e);
                setIsMediaLoaded(false);
              }}
              autoPlay
              type={currentMedia.contentType || 'audio/mpeg'}
            />
          </div>
        );
      default:
        // Check if we can determine the type from contentType
        if (currentMedia.contentType) {
          if (currentMedia.contentType.startsWith('image/')) {
            return (
              <div className="image-preview-wrapper">
                {!isMediaLoaded && (
                  <div className="media-loading-placeholder">
                    <div className="loading-spinner"></div>
                    <p>Loading image...</p>
                  </div>
                )}
                <img
                  src={mediaUrl}
                  alt={displayName}
                  className="preview-image"
                  onLoad={() => setIsMediaLoaded(true)}
                  onError={(e) => {
                    console.error('Error loading image');
                    setIsMediaLoaded(false);
                    e.target.onerror = null; // Prevent infinite error loop
                    e.target.src = '/not-found.png'; // Local fallback image
                  }}
                  type={currentMedia.contentType}
                />
              </div>
            );
          }
        }

        // Check if it's a base64 image that wasn't properly categorized
        if (mediaUrl.startsWith('data:image/')) {
          return (
            <div className="image-preview-wrapper">
              {!isMediaLoaded && (
                <div className="media-loading-placeholder">
                  <div className="loading-spinner"></div>
                  <p>Loading image...</p>
                </div>
              )}
              <img
                src={mediaUrl}
                alt={displayName}
                className="preview-image"
                onLoad={() => setIsMediaLoaded(true)}
                onError={(e) => {
                  console.error('Error loading base64 image');
                  setIsMediaLoaded(false);
                  e.target.onerror = null; // Prevent infinite error loop
                  e.target.src = '/not-found.png'; // Local fallback image
                }}
              />
            </div>
          );
        }

        return (
          <div className="unsupported-media">
            <FaTimes className="error-icon" />
            <p>Unsupported media type: {currentMedia.contentType || mediaType}</p>
          </div>
        );
    }
  };

  return (
    <div className="enhanced-preview-overlay" onClick={onClose}>
      <div className="enhanced-preview-backdrop"></div>

      <div
        className={`enhanced-preview-container ${isControlsVisible ? 'show-controls' : 'hide-controls'}`}
        ref={containerRef}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <button className="enhanced-close-btn" onClick={onClose} aria-label="Close preview">
          <XCircle size={24} className="lucide-icon" />
          <FaTimes className="fa-icon" size={20} />
          <span className="emoji-fallback">⛌</span>
          <span className="btn-text">Close</span>
        </button>

        {mediaFiles.length > 1 && (
          <div className="file-counter-indicator">
            {currentIndex + 1} / {mediaFiles.length}
          </div>
        )}

        <button
          className="enhanced-info-btn"
          title="Media Information"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
        >
          <Info size={20} className="lucide-icon" />
          <FaInfoCircle className="fa-icon" size={16} />
          <span className="emoji-fallback">ⓘ</span>
          <span className="btn-text">Info</span>
        </button>

        {showInfoPanel && (
          <div className="media-info-panel">
            <div className="info-panel-header">
              <h3>Media Information</h3>
            </div>
            <div className="info-panel-content">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{currentMedia.fileName || currentMedia.name || 'Unknown File'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{currentMedia.type || 'Unknown'}</span>
              </div>
              {(currentMedia.type === 'video' || currentMedia.type === 'audio') && (
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{formatTime(duration)}</span>
                </div>
              )}
              {currentMedia.createdOn && (
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">{new Date(currentMedia.createdOn).toLocaleString()}</span>
                </div>
              )}
              {currentMedia.size && (
                <div className="info-item">
                  <span className="info-label">Size:</span>
                  <span className="info-value">{formatFileSize(currentMedia.size)}</span>
                </div>
              )}
              {currentMedia.url && (
                <div className="info-item">
                  <span className="info-label">URL:</span>
                  <span className="info-value info-url">{currentMedia.url}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="enhanced-preview-media">
          {renderMedia()}
        </div>



        {(getMediaType(currentMedia) === 'video' || getMediaType(currentMedia) === 'audio') && (
          <div className={`unified-media-controls ${isControlsVisible ? 'visible' : 'hidden'}`}>
            {/* Progress bar */}
            <div className="unified-progress-container">
              <div className="unified-progress-bar" onClick={seek}>
                <div
                  className="unified-progress-filled"
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                ></div>
                <div
                  className="unified-progress-handle"
                  style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="unified-controls-row">

              <div className="unified-control-buttons-left">
                <button
                  className="unified-control-btn prev-btn"
                  onClick={navigatePrev}
                  aria-label="Previous"
                  title="Previous"
                >
                  <SkipBack size={28} className="lucide-icon" />
                  <FaStepBackward className="fa-icon" size={18} />
                  <span className="emoji-fallback">⏮</span>
                </button>

                <button
                  className="unified-control-btn play-pause-btn"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={32} className="lucide-icon" />
                      <FaPause className="fa-icon" size={20} />
                      <span className="emoji-fallback">❚❚</span>
                    </>
                  ) : (
                    <>
                      <Play size={32} className="lucide-icon" />
                      <FaPlay className="fa-icon" size={20} />
                      <span className="emoji-fallback">▶</span>
                    </>
                  )}
                </button>

                <button
                  className="unified-control-btn next-btn"
                  onClick={navigateNext}
                  aria-label="Next"
                  title="Next"
                >
                  <SkipForward size={28} className="lucide-icon" />
                  <FaStepForward className="fa-icon" size={18} />
                  <span className="emoji-fallback">⏭</span>
                </button>

                <div className="unified-volume-control">
                  <button
                    className="unified-control-btn volume-btn"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX size={28} className="lucide-icon" />
                        <FaVolumeMute className="fa-icon" size={18} />
                        <span className="emoji-fallback">🔇</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={28} className="lucide-icon" />
                        <FaVolumeUp className="fa-icon" size={18} />
                        <span className="emoji-fallback">🔊</span>
                      </>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={changeVolume}
                    className="unified-volume-slider"
                    aria-label="Volume"
                  />
                </div>
              </div>

              <div className="unified-time-display">
                {formatTime(currentTime)} / {formatTime(duration || 0)}
              </div>

              <div className="unified-control-buttons-right">
                <button
                  className="unified-control-btn fullscreen-btn"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 size={16} className="lucide-icon" />
                      <FaCompress className="fa-icon" size={14} />
                      <span className="emoji-fallback">⮌</span>
                    </>
                  ) : (
                    <>
                      <Square size={16} className="lucide-icon" />
                      <FaExpand className="fa-icon" size={14} />
                      <span className="emoji-fallback">⛶</span>
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>
        )}

        {mediaFiles.length > 1 && (
          <div className="enhanced-preview-navigation">
            <button
              className="enhanced-nav-btn prev"
              onClick={navigatePrev}
              aria-label="Previous media"
              title="Previous"
            >
              <SkipBack size={32} className="lucide-icon" />
              <FaChevronLeft className="fa-icon" size={20} />
              <span className="emoji-fallback">⋘</span>
              <span className="btn-text">Previous</span>
            </button>

            <button
              className="enhanced-nav-btn next"
              onClick={navigateNext}
              aria-label="Next media"
              title="Next"
            >
              <SkipForward size={32} className="lucide-icon" />
              <FaChevronRight className="fa-icon" size={20} />
              <span className="emoji-fallback">⋙</span>
              <span className="btn-text">Next</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

EnhancedMediaPreview.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentItem: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    fileName: PropTypes.string,
    blobName: PropTypes.string,
    url: PropTypes.string,
    blobUrl: PropTypes.string,
    type: PropTypes.string,
    mediaType: PropTypes.string,
    thumbnailUrl: PropTypes.string
  }),
  mediaFiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      fileName: PropTypes.string,
      blobName: PropTypes.string,
      url: PropTypes.string,
      blobUrl: PropTypes.string,
      type: PropTypes.string,
      mediaType: PropTypes.string,
      thumbnailUrl: PropTypes.string,
      createdOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      size: PropTypes.number
    })
  ).isRequired
};

export default EnhancedMediaPreview;

