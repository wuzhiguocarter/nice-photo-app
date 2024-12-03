import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo } from '../types/photo';

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  const handlePrevious = () => {
    if (currentIndex > 0 && !isLoading) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1 && !isLoading) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    setIsDragging(false);
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -100 && currentIndex < photos.length - 1) {
      handleNext();
    } else if (swipe > 100 && currentIndex > 0) {
      handlePrevious();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        disabled={currentIndex === 0 || isLoading}
        className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-50"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={currentIndex === photos.length - 1 || isLoading}
        className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-50"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="absolute w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[currentIndex].originalUrl}
              alt={photos[currentIndex].name}
              className={`max-h-[90vh] max-w-[90vw] object-contain ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-white z-50">
        <p className="text-sm">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">加载中...</div>
        </div>
      )}
    </div>
  );
};