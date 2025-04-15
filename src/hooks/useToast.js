/**
 * Custom hook for toast notifications
 */

import { useCallback } from 'react';

/**
 * Custom hook for toast notifications
 * @returns {Object} Toast notification functions
 */
export const useToast = () => {
  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info)
   * @param {number} duration - Toast duration in milliseconds
   * @returns {string|null} - Toast ID or null if toast manager is not available
   */
  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    // Throttle toast notifications to prevent excessive re-renders
    const now = Date.now();
    const lastToastTime = window._lastToastTime || 0;

    // Only show a toast every 500ms
    if (now - lastToastTime < 500) {
      return null;
    }

    window._lastToastTime = now;

    if (window.toastManager && window.toastManager.addToast) {
      return window.toastManager.addToast(message, type, duration);
    }
    console.warn('Toast manager not found. Make sure ToastContainer is mounted.');
    return null;
  }, []);

  /**
   * Show a success toast notification
   * @param {string} message - Toast message
   * @param {number} duration - Toast duration in milliseconds
   * @returns {string|null} - Toast ID or null if toast manager is not available
   */
  const showSuccessToast = useCallback((message, duration = 5000) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  /**
   * Show an error toast notification
   * @param {string} message - Toast message
   * @param {number} duration - Toast duration in milliseconds
   * @returns {string|null} - Toast ID or null if toast manager is not available
   */
  const showErrorToast = useCallback((message, duration = 5000) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  /**
   * Show an info toast notification
   * @param {string} message - Toast message
   * @param {number} duration - Toast duration in milliseconds
   * @returns {string|null} - Toast ID or null if toast manager is not available
   */
  const showInfoToast = useCallback((message, duration = 5000) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  /**
   * Remove a toast notification
   * @param {string} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    if (window.toastManager && window.toastManager.removeToast) {
      window.toastManager.removeToast(id);
    }
  }, []);

  return {
    showToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    removeToast
  };
};
