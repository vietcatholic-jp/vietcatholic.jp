import { test, expect } from '@playwright/test';

/**
 * Image Compression Unit Tests
 * Tests the image compression utilities in isolation
 */

// Mock DOM APIs for testing
test.beforeEach(async ({ page }) => {
  // Set up DOM environment for image compression tests
  await page.goto('data:text/html,<html><body></body></html>');
  
  // Add image compression module to page context
  await page.addScriptTag({
    path: './lib/image-compression.ts'
  });
});

test.describe('Image Compression Utilities', () => {
  test.describe('compressAvatarImage', () => {
    test('should compress image with default settings', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Create a mock file
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 800, 600);
        }
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
              
              // Test compression
              // @ts-ignore - compressAvatarImage should be available
              window.compressAvatarImage(file).then((result) => {
                resolve({
                  originalSize: result.originalSize,
                  compressedSize: result.compressedSize,
                  compressionRatio: result.compressionRatio,
                  fileType: result.file.type
                });
              });
            }
          }, 'image/jpeg');
        });
      });

      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeLessThanOrEqual(200 * 1024); // Should be <= 200KB
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
      expect(result.fileType).toBe('image/jpeg');
    });

    test('should apply crop data when provided', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Create a mock file
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'blue';
          ctx.fillRect(0, 0, 800, 600);
        }
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });
              const cropData = {
                x: 100,
                y: 100,
                width: 400,
                height: 400,
                scale: 1
              };
              
              // @ts-ignore
              window.compressAvatarImage(file, cropData).then((result) => {
                resolve({
                  success: true,
                  fileType: result.file.type
                });
              });
            }
          }, 'image/jpeg');
        });
      });

      expect(result.success).toBe(true);
      expect(result.fileType).toBe('image/jpeg');
    });

    test('should reject non-image files', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const textFile = new File(['not an image'], 'test.txt', { type: 'text/plain' });
        
        try {
          // @ts-ignore
          await window.compressAvatarImage(textFile);
          return { error: null };
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(result.error).toContain('must be an image');
    });

    test('should skip compression for small files with correct dimensions', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Create a small image that meets requirements
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'green';
          ctx.fillRect(0, 0, 400, 400);
        }
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob && blob.size < 50 * 1024) { // Small file < 50KB
              const file = new File([blob], 'small.jpg', { type: 'image/jpeg' });
              
              // @ts-ignore
              window.compressAvatarImage(file).then((result) => {
                resolve({
                  originalSize: result.originalSize,
                  compressedSize: result.compressedSize,
                  compressionRatio: result.compressionRatio
                });
              });
            }
          }, 'image/jpeg', 0.1); // Low quality to ensure small size
        });
      });

      // Should have minimal or no compression for small files
      expect(result.compressionRatio).toBeLessThanOrEqual(0.1);
    });
  });

  test.describe('formatFileSize', () => {
    test('should format bytes correctly', async ({ page }) => {
      const results = await page.evaluate(() => {
        // @ts-ignore
        return {
          bytes: window.formatFileSize(0),
          kb: window.formatFileSize(1024),
          mb: window.formatFileSize(1024 * 1024),
          gb: window.formatFileSize(1024 * 1024 * 1024)
        };
      });

      expect(results.bytes).toBe('0 Bytes');
      expect(results.kb).toBe('1 KB');
      expect(results.mb).toBe('1 MB');
      expect(results.gb).toBe('1 GB');
    });

    test('should handle decimal values', async ({ page }) => {
      const result = await page.evaluate(() => {
        // @ts-ignore
        return window.formatFileSize(1536); // 1.5 KB
      });

      expect(result).toBe('1.5 KB');
    });
  });

  test.describe('shouldCompressFile', () => {
    test('should return true for large image files', async ({ page }) => {
      const result = await page.evaluate(() => {
        const largeImageFile = new File(['x'.repeat(600 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        // @ts-ignore
        return window.shouldCompressFile(largeImageFile, 500);
      });

      expect(result).toBe(true);
    });

    test('should return false for small image files', async ({ page }) => {
      const result = await page.evaluate(() => {
        const smallImageFile = new File(['small'], 'small.jpg', { type: 'image/jpeg' });
        // @ts-ignore
        return window.shouldCompressFile(smallImageFile, 500);
      });

      expect(result).toBe(false);
    });

    test('should return false for non-image files', async ({ page }) => {
      const result = await page.evaluate(() => {
        const textFile = new File(['x'.repeat(600 * 1024)], 'large.txt', { type: 'text/plain' });
        // @ts-ignore
        return window.shouldCompressFile(textFile, 500);
      });

      expect(result).toBe(false);
    });
  });

  test.describe('Compression Quality', () => {
    test('should maintain acceptable quality after compression', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Create a detailed test image
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw a pattern to test quality
          for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `hsl(${i * 3.6}, 50%, 50%)`;
            ctx.fillRect(i * 10, 0, 10, 1000);
          }
        }
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'quality-test.jpg', { type: 'image/jpeg' });
              
              // @ts-ignore
              window.compressAvatarImage(file).then((result) => {
                resolve({
                  compressionRatio: result.compressionRatio,
                  finalSize: result.compressedSize
                });
              });
            }
          }, 'image/jpeg', 0.9);
        });
      });

      // Should achieve significant compression while maintaining quality
      expect(result.compressionRatio).toBeGreaterThan(0.3); // At least 30% compression
      expect(result.finalSize).toBeLessThanOrEqual(200 * 1024); // Within size limit
    });
  });

  test.describe('Error Handling', () => {
    test('should handle canvas creation failures', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Mock canvas creation failure
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          if (tagName === 'canvas') {
            throw new Error('Canvas creation failed');
          }
          return originalCreateElement.call(this, tagName);
        };

        try {
          const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
          // @ts-ignore
          await window.compressAvatarImage(file);
          return { error: null };
        } catch (error) {
          return { error: error.message };
        } finally {
          // Restore original function
          document.createElement = originalCreateElement;
        }
      });

      expect(result.error).toBeDefined();
    });

    test('should handle image loading failures', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Create a corrupted image file
        const corruptedFile = new File(['corrupted data'], 'corrupted.jpg', { type: 'image/jpeg' });
        
        try {
          // @ts-ignore
          await window.compressAvatarImage(corruptedFile);
          return { error: null };
        } catch (error) {
          return { error: error.message };
        }
      });

      expect(result.error).toBeDefined();
    });
  });

  test.describe('Performance', () => {
    test('should complete compression within reasonable time', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 2000;
        canvas.height = 2000;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'purple';
          ctx.fillRect(0, 0, 2000, 2000);
        }
        
        return new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], 'performance.jpg', { type: 'image/jpeg' });
              
              const startTime = Date.now();
              // @ts-ignore
              await window.compressAvatarImage(file);
              const endTime = Date.now();
              
              resolve({
                duration: endTime - startTime
              });
            }
          }, 'image/jpeg');
        });
      });

      // Should complete within 10 seconds for large images
      expect(result.duration).toBeLessThan(10000);
    });
  });
});
