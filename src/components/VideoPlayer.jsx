import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ src, className, isPreview = false }) => {
  const videoRef = useRef(null);
  // Initialize states
  const [isMuted, setIsMuted] = useState(true);
  // We always assume videos have audio for better UX
  const [isPlaying, setIsPlaying] = useState(false);

  // Update muted state when preview mode changes
  useEffect(() => {
    // Only mute in preview mode
    setIsMuted(isPreview);

    // If not in preview mode, ensure video is not muted after a short delay
    // This helps with autoplay policies while still enabling sound
    if (!isPreview && videoRef.current) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.muted = false;
          setIsMuted(false);
          console.log('Unmuted video in gallery view');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isPreview]);

  // Check if video has audio when metadata is loaded
  const checkForAudio = () => {
    const video = videoRef.current;
    if (!video) return;

    // IMPORTANT: We'll always assume videos have audio
    // This is because browser detection methods are unreliable
    // and we'd rather show audio controls unnecessarily than miss them
    console.log("Assuming video has audio for better user experience");

    // Log detection attempts for debugging
    try {
      if (video.mozHasAudio !== undefined) {
        console.log('mozHasAudio detection:', video.mozHasAudio);
      }

      if (video.webkitAudioDecodedByteCount !== undefined) {
        console.log('webkitAudioDecodedByteCount:', video.webkitAudioDecodedByteCount);
      }

      if (video.audioTracks !== undefined) {
        console.log('audioTracks length:', video.audioTracks.length);
      }
    } catch (e) {
      console.warn('Error during audio detection logging:', e);
    }

    // If in preview mode, try to play the video
    if (isPreview) {
      video.muted = true; // Ensure muted for autoplay
      video.play().catch(err => console.log('Auto-play prevented:', err));
    } else {
      // If not in preview mode, ensure sound is enabled
      video.muted = false;
      setIsMuted(false);
    }
  };

  // Toggle mute state - used in the UI
  // eslint-disable-next-line no-unused-vars
  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Ensure video is not muted when playing
      if (video.muted) {
        console.log('Setting video to unmuted before play');
        video.muted = false;
        setIsMuted(false);
      }

      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Error playing video:", err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Update playing state when video plays or pauses
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Auto-play in preview mode
    if (isPreview && video.paused) {
      // Use a timeout to ensure the video is ready
      const playPromise = setTimeout(() => {
        video.play().catch(err => console.log('Auto-play prevented:', err));
      }, 100);

      return () => clearTimeout(playPromise);
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isPreview]);

  // Log for debugging
  console.log('VideoPlayer render:', { src, isPreview, className });

  return (
    <div className={`video-player-container ${isPlaying ? 'playing' : ''} ${isPreview ? 'preview-mode' : ''}`}>
      {src ? (
        <video
          ref={videoRef}
          className={className}
          src={src}
          controls={!isPreview}
          playsInline
          preload="metadata"
          muted={isMuted}
          onClick={isPreview ? undefined : togglePlayPause}
          onLoadedMetadata={checkForAudio}
          loop={isPreview}
          autoPlay={isPreview}
          onPlay={() => {
            // Ensure sound is enabled when playing
            if (!isPreview && videoRef.current && videoRef.current.muted) {
              console.log('Enabling sound on play');
              videoRef.current.muted = false;
              setIsMuted(false);
            }
          }}
        />
      ) : (
        <div className="video-error">No video source provided</div>
      )}

      {/* Sound toggle button removed */}
    </div>
  );
};

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  className: PropTypes.string,
  isPreview: PropTypes.bool
};

VideoPlayer.defaultProps = {
  className: '',
  isPreview: false
};

export default VideoPlayer;
