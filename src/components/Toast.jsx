/**
 * Toast Notification Component
 * Displays toast notifications for success, error, and info messages
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type, duration, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!duration) return;

    let fadeOutTimer;
    const timer = setTimeout(() => {
      setVisible(false);
      fadeOutTimer = setTimeout(() => {
        onClose();
      }, 300); // Wait for fade-out animation
    }, duration);

    return () => {
      clearTimeout(timer);
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    // Use a timeout to wait for the animation to complete
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade-out animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaExclamationCircle />;
      case 'info':
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <div className={`toast toast-${type} ${visible ? 'visible' : 'hidden'}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        {message}
      </div>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired
};

Toast.defaultProps = {
  type: 'info',
  duration: 5000 // 5 seconds
};

export default Toast;
