import React, { useEffect } from 'react';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoGrid } from './components/PhotoGrid';
import { ActionBar } from './components/ActionBar';
import { ImageIcon } from 'lucide-react';
import { usePhotoStore } from './store/usePhotoStore';

function App() {
  const { initializeStore, initialized } = usePhotoStore();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <ImageIcon className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">照片管理器</h1>
        </div>
        
        <div className="space-y-8">
          <PhotoUploader />
          <ActionBar />
          <PhotoGrid />
        </div>
      </div>
    </div>
  );
}

export default App;