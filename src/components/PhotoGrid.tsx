import React from 'react';
import { X } from 'lucide-react';
import { usePhotoStore } from '../store/usePhotoStore';

export const PhotoGrid: React.FC = () => {
  const { photos, removePhoto } = usePhotoStore();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <img
            src={photo.url}
            alt={photo.name}
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={() => removePhoto(photo.id)}
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
  );
};