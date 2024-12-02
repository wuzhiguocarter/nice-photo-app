import { create } from 'zustand';
import { Photo } from '../types/photo';
import { webdavStorage } from '../utils/webdav';

interface PhotoStore {
  photos: Photo[];
  initialized: boolean;
  addPhotos: (newPhotos: Photo[]) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  clearPhotos: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  initialized: false,
  addPhotos: async (newPhotos) => {
    await webdavStorage.savePhotos(newPhotos);
    set((state) => ({ photos: [...state.photos, ...newPhotos] }));
  },
  removePhoto: async (id) => {
    await webdavStorage.deletePhoto(id);
    set((state) => ({ photos: state.photos.filter((photo) => photo.id !== id) }));
  },
  clearPhotos: async () => {
    await webdavStorage.clearPhotos();
    set({ photos: [] });
  },
  initializeStore: async () => {
    const photos = await webdavStorage.getAllPhotos();
    set({ photos, initialized: true });
  },
}));