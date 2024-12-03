import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { usePhotoStore } from '../store/usePhotoStore';
import { useSortStore } from '../store/useSortStore';
import { PhotoViewer } from './PhotoViewer';

export const PhotoGrid: React.FC = () => {
  const { photos, removePhoto } = usePhotoStore();
  const { order } = useSortStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      const comparison = a.lastModified - b.lastModified;
      return order === 'desc' ? -comparison : comparison;
    });
  }, [photos, order]);

  const handlePhotoClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedPhotos.map((photo, index) => (
          <div 
            key={photo.id} 
            className="relative group cursor-pointer"
            onClick={() => handlePhotoClick(index)}
          >
            <img
              src={photo.url}
              alt={photo.name}
              className="w-full h-48 object-cover rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removePhoto(photo.id);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate rounded-b-lg">
              {photo.name}
            </div>
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <PhotoViewer
          photos={sortedPhotos}
          initialIndex={selectedIndex}
          onClose={handleClose}
        />
      )}
    </>
  );
};