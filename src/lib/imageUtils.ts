const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

/**
 * Compresses an image file to a base64 JPEG string.
 * Resizes if larger than MAX_DIMENSION while preserving aspect ratio.
 */
export function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      URL.revokeObjectURL(img.src);
      resolve(base64);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}
