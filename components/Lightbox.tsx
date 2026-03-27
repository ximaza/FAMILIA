import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  src: string;
  caption?: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ isOpen, src, caption, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-[101]"
        aria-label="Cerrar imagen"
      >
        <X size={32} />
      </button>

      <div
        className="relative max-w-7xl max-h-screen p-4 flex flex-col items-center justify-center animate-fade-in"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image container
      >
        <img
          src={src}
          alt={caption || 'Imagen ampliada'}
          className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl"
          // We don't need lazy loading here as the lightbox is only rendered when opened
        />
        {caption && (
          <p className="mt-4 text-white text-lg font-serif italic text-center drop-shadow-md">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
