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

export const uploadImage = async (base64Image: string, folder: string = 'images'): Promise<string> => {
  const userId = localStorage.getItem('maz_current_user_id');
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId
    },
    body: JSON.stringify({ image: base64Image, folder })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.url; // Returns the public URL (or the base64 string if in local fallback)
};
