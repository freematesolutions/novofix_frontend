import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

export default function ImageZoomModal({ isOpen, onClose, imageUrl, alt, mediaData }) {
  const { t } = useTranslation();
  const [isZoomed, setIsZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const videoRef = useRef(null);

  // Detectar si es un video
  const isVideo = useCallback(() => {
    if (mediaData?.type === 'video') return true;
    if (!imageUrl) return false;
    // Detectar por URL
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const urlLower = imageUrl.toLowerCase();
    if (videoExtensions.some(ext => urlLower.includes(ext))) return true;
    // Detectar por ruta de Cloudinary
    if (urlLower.includes('/video/upload/')) return true;
    return false;
  }, [imageUrl, mediaData]);

  // Obtener URL real del video (quitar transformaciones de thumbnail)
  const getVideoUrl = useCallback(() => {
    if (!imageUrl) return '';
    // Si tiene transformaciones de thumbnail de Cloudinary, quitarlas
    if (imageUrl.includes('/video/upload/so_0,f_jpg')) {
      return imageUrl.replace('/video/upload/so_0,f_jpg,w_400,h_400,c_fill/', '/video/upload/');
    }
    return imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Resetear estados al cerrar
  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
      setImgOffset({ x: 0, y: 0 });
      setDragging(false);
    }
  }, [isOpen]);

  const handleZoom = () => {
    if (isVideo()) return; // No zoom para videos
    setIsZoomed((z) => !z);
    setImgOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (!isZoomed || isVideo()) return;
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

  // Manejar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showVideo = isVideo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        
        {/* Video Player */}
        {showVideo ? (
          <video
            ref={videoRef}
            src={getVideoUrl()}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[95vw] rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {t('imageZoom.videoNotSupported', 'Tu navegador no soporta la reproducción de videos.')}
          </video>
        ) : (
          /* Image with Zoom */
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
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors z-10"
          aria-label={t('common.close', 'Cerrar')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hint Text for Images */}
        {!showVideo && isZoomed && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            {t('imageZoom.dragToMove', 'Arrastra para mover la imagen')}
          </div>
        )}
        {!showVideo && !isZoomed && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
            {t('imageZoom.clickToZoom', 'Click para ampliar y hacer zoom')}
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
  mediaData: PropTypes.object,
};
