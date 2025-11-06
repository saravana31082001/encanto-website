import React from 'react';
import './ImageViewer.css';

const ImageViewer = ({ imageUrl, alt, onClose }) => {
  if (!imageUrl) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList && e.target.classList.contains('image-viewer-overlay')) {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="image-viewer-overlay" onClick={handleOverlayClick}>
      <button className="image-viewer-close" onClick={onClose} title="Close (Esc)">
        ×
      </button>
      <div className="image-viewer-content">
        <img src={imageUrl} alt={alt || 'Event image'} className="image-viewer-image" />
      </div>
    </div>
  );
};

export default ImageViewer;
