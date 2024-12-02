import { createClient, WebDAVClient } from 'webdav';
import { Photo } from '../types/photo';

export class WebDAVStorage {
  private client: WebDAVClient;
  private baseDir: string = '/photos';

  constructor() {
    // Replace these with your WebDAV server details
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
      const photoPath = `${this.baseDir}/${photo.id}_${photo.name}`;
      const photoBlob = new Blob([await photo.file.arrayBuffer()]);
      await this.client.putFileContents(photoPath, photoBlob);

      // Save metadata
      const metadataPath = `${this.baseDir}/${photo.id}_metadata.json`;
      const metadata = {
        id: photo.id,
        name: photo.name,
        size: photo.size,
        type: photo.type,
        lastModified: photo.lastModified,
      };
      await this.client.putFileContents(metadataPath, JSON.stringify(metadata));
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
          
          const photoPath = `${this.baseDir}/${metadata.id}_${metadata.name}`;
          const photoContent = await this.client.getFileContents(photoPath);
          
          const file = new File([photoContent as Blob], metadata.name, {
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
      
      return photos;
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  async deletePhoto(id: string): Promise<void> {
    const contents = await this.client.getDirectoryContents(this.baseDir);
    const photoFile = contents.find(item => item.filename.startsWith(`${id}_`) && !item.filename.endsWith('_metadata.json'));
    const metadataFile = contents.find(item => item.filename === `${id}_metadata.json`);

    if (photoFile) {
      await this.client.deleteFile(photoFile.filename);
    }
    if (metadataFile) {
      await this.client.deleteFile(metadataFile.filename);
    }
  }

  async clearPhotos(): Promise<void> {
    const contents = await this.client.getDirectoryContents(this.baseDir);
    for (const item of contents) {
      await this.client.deleteFile(item.filename);
    }
  }
}

export const webdavStorage = new WebDAVStorage();