import { Photo } from '../types/photo';

const DB_NAME = 'PhotoManagerDB';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

export class PhotoDB {
  private db: IDBDatabase | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async savePhotos(photos: Photo[]): Promise<void> {
    if (!this.db) await this.connect();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      photos.forEach(photo => {
        store.put(photo);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllPhotos(): Promise<Photo[]> {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const photos = request.result.map(photo => ({
          ...photo,
          file: new File([photo.file], photo.name, {
            type: photo.type,
            lastModified: photo.lastModified,
          }),
          url: URL.createObjectURL(
            new File([photo.file], photo.name, {
              type: photo.type,
              lastModified: photo.lastModified,
            })
          ),
        }));
        resolve(photos);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhoto(id: string): Promise<void> {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPhotos(): Promise<void> {
    if (!this.db) await this.connect();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const photoDB = new PhotoDB();