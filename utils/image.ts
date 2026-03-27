import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<string> => {
  const options = {
    maxSizeMB: 0.5,          // Set max size to 500KB
    maxWidthOrHeight: 1200,  // Reduce image resolution
    useWebWorker: true,
    fileType: "image/webp"   // Convert to lightweight WebP format
  };

  try {
    const compressedFile = await imageCompression(file, options);

    // Convert back to Base64 to save in the JSON config
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
  } catch (error) {
    console.error("Compression failed:", error);
    throw error;
  }
};
