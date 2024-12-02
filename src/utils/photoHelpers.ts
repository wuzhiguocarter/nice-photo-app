import JSZip from 'jszip';

export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const createPhotoObjects = (files: File[]) => {
  return files.map((file) => ({
    id: generateUniqueId(),
    file,
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  }));
};

export const downloadPhotos = async (photos: { file: File; name: string }[]) => {
  const zip = new JSZip();
  
  photos.forEach(({ file, name }) => {
    zip.file(name, file);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'photos.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
};