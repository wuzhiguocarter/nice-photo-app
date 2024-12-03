import React from 'react';
import { Download, Trash2, ArrowUpDown } from 'lucide-react';
import { usePhotoStore } from '../store/usePhotoStore';
import { useSortStore } from '../store/useSortStore';
import { downloadPhotos } from '../utils/photoHelpers';

export const ActionBar: React.FC = () => {
  const { photos, clearPhotos } = usePhotoStore();
  const { order, toggleOrder } = useSortStore();

  const handleDownload = async () => {
    if (photos.length === 0) return;
    await downloadPhotos(photos);
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm rounded-lg">
      <div className="flex items-center gap-4">
        <div className="text-gray-700">
          已选择 {photos.length} 张照片
        </div>
        <button
          onClick={toggleOrder}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          {order === 'desc' ? '最新在前' : '最早在前'}
        </button>
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          disabled={photos.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          下载全部
        </button>
        <button
          onClick={clearPhotos}
          disabled={photos.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          清除全部
        </button>
      </div>
    </div>
  );
};