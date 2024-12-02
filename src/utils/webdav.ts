import { createClient, WebDAVClient } from 'webdav';
import { Photo } from '../types/photo';

export class WebDAVStorage {
  private client: WebDAVClient;
  private baseDir: string = '/photos';

  constructor() {
    const webdavUrl = import.meta.env.VITE_WEBDAV_URL || '';
    const username = import.meta.env.VITE_WEBDAV_USERNAME || '';
    const password = import.meta.env.VITE_WEBDAV_PASSWORD || '';

    this.client = createClient(webdavUrl, {
      username,
      password,
    });
  }

  private async ensureBaseDir() {
    try {
      const exists = await this.client.exists(this.baseDir);
      if (!exists) {
        await this.client.createDirectory(this.baseDir);
      }
    } catch (error) {
      console.error('Error ensuring base directory exists:', error);
      throw error;
    }
  }

  async savePhotos(photos: Photo[]): Promise<void> {
    await this.ensureBaseDir();
    
    for (const photo of photos) {
      try {
        // Convert File to ArrayBuffer
        const buffer = await photo.file.arrayBuffer();
        const photoPath = `${this.baseDir}/${photo.id}_${photo.name}`;
        
        // Upload the photo file as binary data
        await this.client.putFileContents(photoPath, buffer, {
          contentLength: buffer.byteLength,
          overwrite: true
        });

        // Save metadata
        const metadataPath = `${this.baseDir}/${photo.id}_metadata.json`;
        const metadata = {
          id: photo.id,
          name: photo.name,
          size: photo.size,
          type: photo.type,
          lastModified: photo.lastModified,
        };
        await this.client.putFileContents(metadataPath, JSON.stringify(metadata), {
          overwrite: true
        });
      } catch (error) {
        console.error(`Error saving photo ${photo.name}:`, error);
        throw error;
      }
    }
  }

  async getAllPhotos(): Promise<Photo[]> {
    await this.ensureBaseDir();
    
    try {
      const contents = await this.client.getDirectoryContents(this.baseDir);
      const photos: Photo[] = [];
      
      for (const item of contents) {
        if (item.filename.endsWith('_metadata.json')) {
          const metadataContent = await this.client.getFileContents(item.filename, { format: 'text' });
          const metadata = JSON.parse(metadataContent as string);
          
          const photoFileName = `${metadata.id}_${metadata.name}`;
          const photoPath = `${this.baseDir}/${photoFileName}`;
          const photoContent = await this.client.getFileContents(photoPath, { format: 'binary' });
          
          if (photoContent instanceof ArrayBuffer) {
            const blob = new Blob([photoContent], { type: metadata.type });
            const file = new File([blob], metadata.name, {
              type: metadata.type,
              lastModified: metadata.lastModified,
            });

            photos.push({
              ...metadata,
              file,
              url: URL.createObjectURL(file),
            });
          }
        }
      }
      
      return photos;
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  async deletePhoto(id: string): Promise<void> {
    try {
      const contents = await this.client.getDirectoryContents(this.baseDir);
      const photoFile = contents.find(item => item.filename.startsWith(`${id}_`) && !item.filename.endsWith('_metadata.json'));
      const metadataFile = contents.find(item => item.filename === `${id}_metadata.json`);

      if (photoFile) {
        await this.client.deleteFile(`${this.baseDir}/${photoFile.filename}`);
      }
      if (metadataFile) {
        await this.client.deleteFile(`${this.baseDir}/${metadataFile.filename}`);
      }
    } catch (error) {
      console.error(`Error deleting photo ${id}:`, error);
      throw error;
    }
  }

  async clearPhotos(): Promise<void> {
    try {
      const contents = await this.client.getDirectoryContents(this.baseDir);
      for (const item of contents) {
        await this.client.deleteFile(`${this.baseDir}/${item.filename}`);
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }
}

export const webdavStorage = new WebDAVStorage();