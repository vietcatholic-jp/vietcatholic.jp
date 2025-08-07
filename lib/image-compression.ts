/**
 * Image compression utility for optimizing uploaded images before sending to server
 * Reduces file size while maintaining quality for receipt uploads
 */

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0.1 to 1.0
  maxSizeKB: number; // Maximum file size in KB
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Default compression settings for receipt images
 */
export const DEFAULT_RECEIPT_COMPRESSION: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeKB: 500, // 500KB max for receipts
};

/**
 * Default compression settings for avatar images
 * Optimized for 1:1 aspect ratio with high quality
 */
export const DEFAULT_AVATAR_COMPRESSION: CompressionOptions = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  maxSizeKB: 200, // 200KB max for avatars
};

/**
 * Crop data interface for image cropping
 */
export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * Compresses an image file using HTML5 Canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = DEFAULT_RECEIPT_COMPRESSION
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          options.maxWidth,
          options.maxHeight
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Try different quality levels to meet size requirements
        compressToTargetSize(canvas, file.name, options)
          .then(compressedFile => {
            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: (file.size - compressedFile.size) / file.size
            });
          })
          .catch(reject);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if image is larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress canvas to target file size using binary search on quality
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  fileName: string,
  options: CompressionOptions
): Promise<File> {
  const maxSizeBytes = options.maxSizeKB * 1024;
  let quality = options.quality;
  const minQuality = 0.1;
  let maxQuality = options.quality;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    if (!blob) {
      throw new Error('Failed to create blob from canvas');
    }

    // If size is acceptable, return the file
    if (blob.size <= maxSizeBytes || quality <= minQuality) {
      return new File([blob], fileName, { type: 'image/jpeg' });
    }

    // Binary search for optimal quality
    maxQuality = quality;
    quality = (minQuality + maxQuality) / 2;
    attempts++;
  }

  // If we can't meet the size requirement, return the smallest version
  const finalBlob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', minQuality);
  });

  if (!finalBlob) {
    throw new Error('Failed to create final compressed blob');
  }

  return new File([finalBlob], fileName, { type: 'image/jpeg' });
}

/**
 * Batch compress multiple image files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = DEFAULT_RECEIPT_COMPRESSION,
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length);

    try {
      if (file.type.startsWith('image/')) {
        const result = await compressImage(file, options);
        results.push(result);
      } else {
        // For non-image files (like PDFs), return as-is
        results.push({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0
        });
      }
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // If compression fails, use original file
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      });
    }
  }

  return results;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Compress avatar image with optional crop data
 * Optimized for avatar workflow with performance enhancements
 */
export async function compressAvatarImage(
  file: File,
  cropData?: CropData,
  options: CompressionOptions = DEFAULT_AVATAR_COMPRESSION
): Promise<CompressionResult> {
  // Validate input file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Check if file is already small enough
  if (file.size <= options.maxSizeKB * 1024 && !cropData) {
    // Still need to ensure dimensions are correct
    const needsResize = await checkImageDimensions(file, options.maxWidth, options.maxHeight);
    if (!needsResize) {
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0
      };
    }
  }

  if (cropData) {
    // Apply crop first, then compress
    const croppedFile = await cropImage(file, cropData);
    return compressImage(croppedFile, options);
  }

  return compressImage(file, options);
}

/**
 * Crop image based on crop data
 */
async function cropImage(file: File, cropData: CropData): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Set canvas size to crop dimensions
        canvas.width = cropData.width;
        canvas.height = cropData.height;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Apply scale and draw cropped portion
        ctx.drawImage(
          img,
          cropData.x,
          cropData.y,
          cropData.width,
          cropData.height,
          0,
          0,
          cropData.width,
          cropData.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create cropped image'));
            return;
          }

          const croppedFile = new File([blob], file.name, { type: file.type });
          resolve(croppedFile);
        }, file.type);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if a file needs compression based on size
 */
export function shouldCompressFile(file: File, maxSizeKB: number = 500): boolean {
  return file.type.startsWith('image/') && file.size > maxSizeKB * 1024;
}

/**
 * Check if image dimensions exceed maximum allowed size
 */
async function checkImageDimensions(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const needsResize = img.width > maxWidth || img.height > maxHeight;
      resolve(needsResize);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for dimension check'));
    };

    img.src = URL.createObjectURL(file);
  });
}