import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

export default function ImageZoomModal({ isOpen, onClose, imageUrl, alt }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleZoom = () => {
    setIsZoomed((z) => !z);
    setImgOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (!isZoomed) return;
    setDragging(true);
    setDragStart({ x: e.clientX - imgOffset.x, y: e.clientY - imgOffset.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    setImgOffset({ x, y });
  }, [dragging, dragStart]);

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt}
          className={`max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl transition-transform duration-300 ${isZoomed ? 'cursor-move' : 'cursor-zoom-in'}`}
          style={isZoomed ? {
            transform: `scale(2) translate(${imgOffset.x / 2}px, ${imgOffset.y / 2}px)`,
            transition: 'none',
            willChange: 'transform',
          } : {}}
          onClick={handleZoom}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {isZoomed && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            Arrastra para mover la imagen
          </div>
        )}
        {!isZoomed && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            Click para ampliar y hacer zoom
          </div>
        )}
      </div>
    </div>
  );
}

ImageZoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string.isRequired,
  alt: PropTypes.string,
};
