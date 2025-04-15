/**
 * Custom hook for theme management
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook for theme management
 * @returns {Object} Theme state and functions
 */
export const useThemeMode = () => {
  // Check if user has a preference in localStorage or use system preference
  const getInitialMode = () => {
    const savedMode = localStorage.getItem('darkMode');

    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }

    // Check system preference
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialMode);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);

    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Only update if user hasn't set a preference
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(mediaQuery.matches);
      }
    };

    // Add event listener for theme change
    // Modern approach that works in all browsers
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return { darkMode, toggleDarkMode };
};
