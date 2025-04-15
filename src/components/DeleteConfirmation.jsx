/**
 * Delete Confirmation Component
 * Displays a stylish confirmation dialog when deleting files
 */

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle } from 'react-icons/fa';

const DeleteConfirmation = ({ isOpen, onConfirm, onCancel, fileName }) => {
  const modalRef = useRef(null);

  // Handle escape key press to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
      document.body.classList.add('delete-confirmation-active'); // Add class for styling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Restore scrolling when modal is closed
      document.body.classList.remove('delete-confirmation-active'); // Remove class
    };
  }, [isOpen, onCancel]);

  // Close modal when clicking outside
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onCancel();
    }
  };

  // Prevent clicks inside the modal from propagating to the overlay
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-overlay" onClick={handleOutsideClick}>
      <div className="delete-confirmation-modal" ref={modalRef} onClick={handleModalClick}>
        <div className="delete-confirmation-icon">
          <FaExclamationTriangle />
        </div>
        <h3>Confirm Deletion</h3>
        <p>
          Are you sure you want to delete
          <span className="delete-filename">{fileName || 'this file'}</span>?
        </p>
        <p className="delete-warning">This action cannot be undone.</p>
        <div className="delete-confirmation-actions">
          <button
            className="delete-cancel-btn"
            onClick={onCancel}
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            className="delete-confirm-btn"
            onClick={onConfirm}
            aria-label="Confirm deletion"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  fileName: PropTypes.string
};

export default DeleteConfirmation;
