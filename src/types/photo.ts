export interface Photo {
  id: string;
  file: File;
  url: string;
  originalUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}