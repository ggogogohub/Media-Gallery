/**
 * Media Preview Component
 * Displays a full-screen preview of media files with navigation controls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress
} from 'react-icons/fa';
import { getFileNameWithoutExtension } from '../utils/fileUtils';
import '../styles/mediaPreview.css';

const MediaPreview = ({ isOpen, onClose, currentItem, mediaFiles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  const mediaRef = useRef(null);
  const containerRef = useRef(null);

  // Navigation functions
  const navigateNext = useCallback(() => {
    if (mediaFiles.length <= 1) return;
    setCurrentIndex(prevIndex => (prevIndex + 1) % mediaFiles.length);
  }, [mediaFiles.length]);

  const navigatePrev = useCallback(() => {
    if (mediaFiles.length <= 1) return;
    setCurrentIndex(prevIndex => (prevIndex - 1 + mediaFiles.length) % mediaFiles.length);
  }, [mediaFiles.length]);

  // Find the index of the current item in the mediaFiles array
  useEffect(() => {
    if (currentItem && mediaFiles.length > 0) {
      const index = mediaFiles.findIndex(item => item.name === currentItem.name);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [currentItem, mediaFiles]);

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
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, mediaFiles.length, navigateNext, navigatePrev, onClose]);

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

  // Handle media events
  const handleMediaPlay = () => setIsPlaying(true);
  const handleMediaPause = () => setIsPlaying(false);
  const handleMediaVolumeChange = (e) => {
    setIsMuted(e.target.muted);
    setVolume(e.target.muted ? 0 : e.target.volume);
  };
  const handleMediaTimeUpdate = () => updateProgress();
  const handleMediaLoadedMetadata = () => updateProgress();

  if (!isOpen || !currentItem || mediaFiles.length === 0) return null;

  const currentMedia = mediaFiles[currentIndex];
  const fileName = getFileNameWithoutExtension(currentMedia.name);

  return (
    <div className="media-preview-overlay">
      <div className="media-preview-backdrop" onClick={onClose}></div>

      <div className="media-preview-container" ref={containerRef}>
        <button className="preview-close-btn" onClick={onClose} aria-label="Close preview">
          <FaTimes />
          <span className="control-label">Close</span>
        </button>

        <div className="preview-media">
          {currentMedia.type === 'images' && (
            <img src={currentMedia.url} alt={fileName} />
          )}

          {currentMedia.type === 'video' && (
            <video
              ref={mediaRef}
              src={currentMedia.url}
              controls={false}
              autoPlay={isPlaying}
              muted={isMuted}
              loop
              onPlay={handleMediaPlay}
              onPause={handleMediaPause}
              onVolumeChange={handleMediaVolumeChange}
              onTimeUpdate={handleMediaTimeUpdate}
              onLoadedMetadata={handleMediaLoadedMetadata}
              // volume is set via JavaScript in the changeVolume function
            />
          )}

          {currentMedia.type === 'audio' && (
            <div className="audio-preview-container">
              <div className="audio-preview-icon">
                <FaVolumeUp size={80} />
              </div>
              <audio
                ref={mediaRef}
                src={currentMedia.url}
                controls={false}
                autoPlay={isPlaying}
                muted={isMuted}
                loop
                onPlay={handleMediaPlay}
                onPause={handleMediaPause}
                onVolumeChange={handleMediaVolumeChange}
                onTimeUpdate={handleMediaTimeUpdate}
                onLoadedMetadata={handleMediaLoadedMetadata}
                // volume is set via JavaScript in the changeVolume function
              />
            </div>
          )}
        </div>

        <div className="preview-info">
          <h2>{fileName}</h2>
        </div>

        {(currentMedia.type === 'video' || currentMedia.type === 'audio') && (
          <div className="preview-media-controls">
            {/* Progress bar */}
            <div className="preview-progress-container">
              <div className="preview-time">{formatTime(currentTime)}</div>
              <div className="preview-progress-bar" onClick={seek}>
                <div
                  className="preview-progress-filled"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
              <div className="preview-time">{formatTime(duration)}</div>
            </div>

            {/* Control buttons */}
            <div className="preview-control-buttons">
              <button
                className="preview-control-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
                <span className="control-label">{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <div className="preview-volume-control">
                <button
                  className="preview-control-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                  <span className="control-label">{isMuted ? "Unmute" : "Mute"}</span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={changeVolume}
                  className="volume-slider"
                  aria-label="Volume"
                />
              </div>

              <button
                className="preview-control-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
                <span className="control-label">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
              </button>
            </div>
          </div>
        )}

        {mediaFiles.length > 1 && (
          <div className="preview-navigation">
            <button
              className="preview-nav-btn prev"
              onClick={navigatePrev}
              aria-label="Previous media"
            >
              <FaChevronLeft />
              <span className="nav-label">Previous</span>
            </button>

            <button
              className="preview-nav-btn next"
              onClick={navigateNext}
              aria-label="Next media"
            >
              <FaChevronRight />
              <span className="nav-label">Next</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

MediaPreview.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentItem: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    containerName: PropTypes.string.isRequired,
    createdOn: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])
  }),
  mediaFiles: PropTypes.array.isRequired
};

export default MediaPreview;
