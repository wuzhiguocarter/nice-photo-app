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
        const buffer = await photo.file.arrayBuffer();
        const photoPath = `${this.baseDir}/${photo.id}_${photo.name}`;
        
        await this.client.putFileContents(photoPath, buffer, {
          contentLength: buffer.byteLength,
          overwrite: true
        });

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
      const metadataFiles = contents.filter(item => 
        item.basename.endsWith('_metadata.json')
      );
      
      for (const metadataFile of metadataFiles) {
        try {
          const metadataContent = await this.client.getFileContents(metadataFile.filename, { 
            format: 'text' 
          });
          const metadata = JSON.parse(metadataContent as string);
          
          const photoFile = contents.find(item => 
            item.basename.startsWith(`${metadata.id}_`) && 
            !item.basename.endsWith('_metadata.json')
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
          console.error(`Error processing metadata file ${metadataFile.filename}:`, error);
        }
      }
      
      return photos;
    } catch (error) {
      console.error('Error getting photos:', error);
      return [];
    }
  }

  async deletePhoto(id: string): Promise<void> {
    await this.ensureBaseDir();
    
    try {
      const contents = await this.client.getDirectoryContents(this.baseDir);
      
      // Find both photo and metadata files
      const photoFile = contents.find(item => 
        item.basename.startsWith(`${id}_`) && 
        !item.basename.endsWith('_metadata.json')
      );
      const metadataFile = contents.find(item => 
        item.basename === `${id}_metadata.json`
      );

      // Delete photo file
      if (photoFile) {
        await this.client.deleteFile(photoFile.filename);
      }

      // Delete metadata file
      if (metadataFile) {
        await this.client.deleteFile(metadataFile.filename);
      }

      if (!photoFile && !metadataFile) {
        console.warn(`No files found for photo ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error deleting photo ${id}:`, error);
      throw error;
    }
  }

  async clearPhotos(): Promise<void> {
    await this.ensureBaseDir();
    
    try {
      const contents = await this.client.getDirectoryContents(this.baseDir);
      for (const item of contents) {
        await this.client.deleteFile(item.filename);
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }
}

export const webdavStorage = new WebDAVStorage();