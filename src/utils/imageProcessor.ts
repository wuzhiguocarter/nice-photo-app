import imageCompression from 'browser-image-compression';

export const generateThumbnail = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
    useWebWorker: true
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};