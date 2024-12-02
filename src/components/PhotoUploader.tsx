import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { usePhotoStore } from '../store/usePhotoStore';
import { createPhotoObjects } from '../utils/photoHelpers';

export const PhotoUploader: React.FC = () => {
  const addPhotos = usePhotoStore((state) => state.addPhotos);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    const photoObjects = createPhotoObjects(files);
    addPhotos(photoObjects);
  }, [addPhotos]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    ) : [];
    const photoObjects = createPhotoObjects(files);
    addPhotos(photoObjects);
  }, [addPhotos]);

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        id="photo-input"
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileInput}
      />
      <label
        htmlFor="photo-input"
        className="cursor-pointer flex flex-col items-center gap-4"
      >
        <Upload className="w-12 h-12 text-gray-400" />
        <div>
          <p className="text-lg font-medium text-gray-700">拖拽照片到这里</p>
          <p className="text-sm text-gray-500">或点击选择照片</p>
        </div>
      </label>
    </div>
  );
};