import { createClient, WebDAVClient } from 'webdav';
import { Photo } from '../types/photo';
import { generateThumbnail } from './imageProcessor';

export class WebDAVStorage {
  private client: WebDAVClient;
  private baseDir: string = '/didi-team-photos';
  private metaDir: string = '/didi-team-photos/metadata';
  private thumbnailDir: string = '/didi-team-photos/thumbnails';

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
      const dirs = [this.baseDir, this.metaDir, this.thumbnailDir];
      for (const dir of dirs) {
        const exists = await this.client.exists(dir);
        if (!exists) {
          await this.client.createDirectory(dir);
        }
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
        // Upload original photo
        const buffer = await photo.file.arrayBuffer();
        const photoPath = `${this.baseDir}/${photo.id}_${photo.name}`;
        await this.client.putFileContents(photoPath, buffer, {
          contentLength: buffer.byteLength,
          overwrite: true
        });

        // Generate and upload thumbnail
        const thumbnail = await generateThumbnail(photo.file);
        const thumbnailBuffer = await thumbnail.arrayBuffer();
        const thumbnailPath = `${this.thumbnailDir}/${photo.id}_${photo.name}`;
        await this.client.putFileContents(thumbnailPath, thumbnailBuffer, {
          contentLength: thumbnailBuffer.byteLength,
          overwrite: true
        });

        // Save metadata
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
      const thumbnailContents = await this.client.getDirectoryContents(this.thumbnailDir);
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
            !item.filename.includes('/metadata/') &&
            !item.filename.includes('/thumbnails/')
          );

          const thumbnailFile = thumbnailContents.find(item =>
            item.basename.startsWith(`${metadata.id}_`)
          );
          
          if (photoFile && thumbnailFile) {
            // Load original photo for file property
            const photoContent = await this.client.getFileContents(photoFile.filename, { 
              format: 'binary' 
            });

            // Load thumbnail for display
            const thumbnailContent = await this.client.getFileContents(thumbnailFile.filename, {
              format: 'binary'
            });
            
            if (photoContent instanceof ArrayBuffer && thumbnailContent instanceof ArrayBuffer) {
              const photoBlob = new Blob([photoContent], { type: metadata.type });
              const thumbnailBlob = new Blob([thumbnailContent], { type: metadata.type });

              const file = new File([photoBlob], metadata.name, {
                type: metadata.type,
                lastModified: metadata.lastModified,
              });

              photos.push({
                ...metadata,
                file,
                url: URL.createObjectURL(thumbnailBlob),
                originalUrl: URL.createObjectURL(photoBlob),
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
      const thumbnailContents = await this.client.getDirectoryContents(this.thumbnailDir);
      
      // Find and delete original photo
      const photoFile = photoContents.find(item => 
        item.basename.startsWith(`${id}_`) && 
        !item.filename.includes('/metadata/') &&
        !item.filename.includes('/thumbnails/')
      );
      if (photoFile) {
        await this.client.deleteFile(photoFile.filename);
      }

      // Find and delete thumbnail
      const thumbnailFile = thumbnailContents.find(item =>
        item.basename.startsWith(`${id}_`)
      );
      if (thumbnailFile) {
        await this.client.deleteFile(thumbnailFile.filename);
      }

      // Delete metadata
      const metadataPath = `${this.metaDir}/${id}.json`;
      if (await this.client.exists(metadataPath)) {
        await this.client.deleteFile(metadataPath);
      }
    } catch (error) {
      console.error(`Error deleting photo ${id}:`, error);
      throw error;
    }
  }

  async clearPhotos(): Promise<void> {
    await this.ensureDirectories();
    
    try {
      const dirs = [this.metaDir, this.thumbnailDir, this.baseDir];
      for (const dir of dirs) {
        const contents = await this.client.getDirectoryContents(dir);
        for (const item of contents) {
          if (!item.filename.endsWith('/')) {
            await this.client.deleteFile(item.filename);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }
}

export const webdavStorage = new WebDAVStorage();