import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import RecommendationWidget from './RecommendationWidget';

/**
 * Modal component that renders its children in a portal
 * Can be used to display content as a popup overlay
 */
function Modal({ isOpen, onClose, children }) {
  const [modalRoot, setModalRoot] = useState(null);

  useEffect(() => {
    // Create or reuse a modal container
    let modalContainer = document.getElementById('modal-root');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'modal-root';
      document.body.appendChild(modalContainer);
    }
    setModalRoot(modalContainer);

    // Prevent scrolling on the body when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key to close the modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        {children}
      </div>
    </div>,
    modalRoot
  );
}

/**
 * RecommendationModal component that wraps the RecommendationWidget in a modal
 */
function RecommendationModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="recommendation-modal">
        <RecommendationWidget onClose={onClose} />
      </div>
    </Modal>
  );
}

export default RecommendationModal;