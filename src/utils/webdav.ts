import { createClient, WebDAVClient } from 'webdav';
import { Photo } from '../types/photo';

export class WebDAVStorage {
  private client: WebDAVClient;
  private baseDir: string = '/didi-team-photos';
  private metaDir: string = '/didi-team-photos/metadata';

  constructor() {
    const webdavUrl = import.meta.env.VITE_WEBDAV_URL || '';
    const username = import.meta.env.VITE_WEBDAV_USERNAME || '';
    const password = import.meta.env.VITE_WEBDAV_PASSWORD || '';

    this.client = createClient(webdavUrl, {
      username,
      password,
    });
  }

  private async ensureDirectories() {
    try {
      const baseExists = await this.client.exists(this.baseDir);
      if (!baseExists) {
        await this.client.createDirectory(this.baseDir);
      }

      const metaExists = await this.client.exists(this.metaDir);
      if (!metaExists) {
        await this.client.createDirectory(this.metaDir);
      }
    } catch (error) {
      console.error('Error ensuring directories exist:', error);
      throw error;
    }
  }

  async savePhotos(photos: Photo[]): Promise<void> {
    await this.ensureDirectories();
    
    for (const photo of photos) {
      try {
        const buffer = await photo.file.arrayBuffer();
        const photoPath = `${this.baseDir}/${photo.id}_${photo.name}`;
        
        await this.client.putFileContents(photoPath, buffer, {
          contentLength: buffer.byteLength,
          overwrite: true
        });

        const metadataPath = `${this.metaDir}/${photo.id}.json`;
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
    await this.ensureDirectories();
    
    try {
      const metaContents = await this.client.getDirectoryContents(this.metaDir);
      const photoContents = await this.client.getDirectoryContents(this.baseDir);
      const photos: Photo[] = [];
      
      for (const metaFile of metaContents) {
        if (!metaFile.basename.endsWith('.json')) continue;
        
        try {
          const metadataContent = await this.client.getFileContents(metaFile.filename, { 
            format: 'text' 
          });
          const metadata = JSON.parse(metadataContent as string);
          
          const photoFile = photoContents.find(item => 
            item.basename.startsWith(`${metadata.id}_`) && 
            !item.filename.includes('/metadata/')
          );
          
          if (photoFile) {
            const photoContent = await this.client.getFileContents(photoFile.filename, { 
              format: 'binary' 
            });
            
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
        } catch (error) {
          console.error(`Error processing metadata file ${metaFile.filename}:`, error);
        }
      }
      
      return photos;
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  async deletePhoto(id: string): Promise<void> {
    await this.ensureDirectories();
    
    try {
      const photoContents = await this.client.getDirectoryContents(this.baseDir);
      
      // Find photo file
      const photoFile = photoContents.find(item => 
        item.basename.startsWith(`${id}_`) && 
        !item.filename.includes('/metadata/')
      );

      // Delete photo file
      if (photoFile) {
        await this.client.deleteFile(photoFile.filename);
      }

      // Delete metadata file
      const metadataPath = `${this.metaDir}/${id}.json`;
      if (await this.client.exists(metadataPath)) {
        await this.client.deleteFile(metadataPath);
      }

      if (!photoFile && !await this.client.exists(metadataPath)) {
        console.warn(`No files found for photo ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error deleting photo ${id}:`, error);
      throw error;
    }
  }

  async clearPhotos(): Promise<void> {
    await this.ensureDirectories();
    
    try {
      // Clear metadata directory
      const metaContents = await this.client.getDirectoryContents(this.metaDir);
      for (const item of metaContents) {
        await this.client.deleteFile(item.filename);
      }

      // Clear photos from base directory (excluding metadata directory)
      const photoContents = await this.client.getDirectoryContents(this.baseDir);
      for (const item of photoContents) {
        if (!item.filename.includes('/metadata/')) {
          await this.client.deleteFile(item.filename);
        }
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }
}

export const webdavStorage = new WebDAVStorage();