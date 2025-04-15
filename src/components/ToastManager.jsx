/**
 * Toast Manager Component
 * Manages multiple toast notifications
 */

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Toast from './Toast';

const ToastManager = ({ position }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Expose methods to window object only once
  useEffect(() => {
    // Create a stable reference to the methods
    const manager = { addToast, removeToast };
    window.toastManager = manager;

    return () => {
      // Only delete if our reference is still there
      if (window.toastManager === manager) {
        delete window.toastManager;
      }
    };
  }, [addToast, removeToast]); // Include dependencies

  return (
    <div className={`toast-container toast-${position}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

ToastManager.propTypes = {
  position: PropTypes.oneOf([
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'top-center',
    'bottom-center'
  ])
};

ToastManager.defaultProps = {
  position: 'top-right'
};

export default ToastManager;
