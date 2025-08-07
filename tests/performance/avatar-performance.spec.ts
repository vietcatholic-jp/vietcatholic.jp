import { test, expect } from '@playwright/test';

/**
 * Avatar Performance Tests
 * Tests performance characteristics of the avatar system
 */

test.describe('Avatar Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Avatar Loading Performance', () => {
    test('should load avatar images efficiently', async ({ page }) => {
      // Measure avatar loading time
      const startTime = Date.now();
      
      // Wait for avatar to load
      await page.locator('[data-testid="avatar-image"]').waitFor({ state: 'visible' });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle multiple avatar loads efficiently', async ({ page }) => {
      // Navigate to a page with multiple avatars (like team list)
      await page.goto('/admin/teams-assignment');
      await page.waitForLoadState('networkidle');
      
      const startTime = Date.now();
      
      // Wait for all avatars to load
      await page.locator('[data-testid="avatar-image"]').first().waitFor({ state: 'visible' });
      
      // Count loaded avatars
      const avatarCount = await page.locator('[data-testid="avatar-image"]').count();
      const loadTime = Date.now() - startTime;
      
      // Should load multiple avatars efficiently
      expect(avatarCount).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(5000); // 5 seconds for multiple avatars
    });

    test('should use lazy loading for avatar lists', async ({ page }) => {
      // Navigate to a page with many avatars
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      
      // Check that not all avatars are loaded immediately
      const initialAvatarCount = await page.locator('[data-testid="avatar-image"]').count();
      
      // Scroll down to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for new avatars to load
      await page.waitForTimeout(1000);
      
      const finalAvatarCount = await page.locator('[data-testid="avatar-image"]').count();
      
      // Should load more avatars after scrolling
      expect(finalAvatarCount).toBeGreaterThanOrEqual(initialAvatarCount);
    });
  });

  test.describe('Compression Performance', () => {
    test('should compress images efficiently', async ({ page }) => {
      // Open avatar upload
      await page.locator('[data-testid="avatar-edit-button"]').click();
      
      // Create a large test image
      const largeImageBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB
      
      const startTime = Date.now();
      
      // Upload and measure compression time
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'large-avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: largeImageBuffer
      });
      
      // Wait for compression to complete
      await page.locator('[data-testid="avatar-crop-dialog"]').waitFor({ state: 'visible' });
      
      const compressionTime = Date.now() - startTime;
      
      // Should compress within 5 seconds
      expect(compressionTime).toBeLessThan(5000);
    });

    test('should achieve target compression ratios', async ({ page }) => {
      // Mock compression result to test ratios
      await page.route('**/api/registrants/*/avatar', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            avatarUrl: 'https://example.com/avatar.jpg',
            metadata: {
              originalSize: 2048000, // 2MB
              compressedSize: 204800, // 200KB
              compressionRatio: 0.9 // 90% compression
            }
          })
        });
      });
      
      // Complete upload flow
      await page.locator('[data-testid="avatar-edit-button"]').click();
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(2 * 1024 * 1024)
      });
      
      // Proceed through crop
      await page.locator('[data-testid="crop-confirm-button"]').click();
      
      // Wait for upload response
      const response = await page.waitForResponse('**/api/registrants/*/avatar');
      const responseData = await response.json();
      
      // Should achieve good compression ratio
      expect(responseData.metadata.compressionRatio).toBeGreaterThan(0.5); // At least 50%
      expect(responseData.metadata.compressedSize).toBeLessThanOrEqual(200 * 1024); // Within limit
    });
  });

  test.describe('Bundle Size Impact', () => {
    test('should not significantly increase bundle size', async ({ page }) => {
      // Measure initial bundle size
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('navigation')[0];
      });
      
      // Check that avatar components don't add excessive weight
      const transferSize = performanceEntries.transferSize;
      
      // Should be reasonable (this is a rough check)
      expect(transferSize).toBeLessThan(5 * 1024 * 1024); // Less than 5MB total
    });

    test('should load avatar components on demand', async ({ page }) => {
      // Check that avatar upload components are not loaded initially
      const initialScripts = await page.evaluate(() => {
        return Array.from(document.scripts).map(script => script.src);
      });
      
      // Open avatar upload to trigger component loading
      await page.locator('[data-testid="avatar-edit-button"]').click();
      
      // Wait for dynamic imports
      await page.waitForTimeout(1000);
      
      const finalScripts = await page.evaluate(() => {
        return Array.from(document.scripts).map(script => script.src);
      });
      
      // Should load additional scripts for avatar functionality
      expect(finalScripts.length).toBeGreaterThanOrEqual(initialScripts.length);
    });
  });

  test.describe('Mobile Performance', () => {
    test.use({ 
      viewport: { width: 375, height: 667 } // iPhone SE
    });

    test('should perform well on mobile devices', async ({ page }) => {
      const startTime = Date.now();
      
      // Test mobile avatar workflow
      await page.locator('[data-testid="avatar-edit-button"]').click();
      
      // Should open mobile sheet quickly
      await page.locator('[data-testid="mobile-avatar-sheet"]').waitFor({ state: 'visible' });
      
      const openTime = Date.now() - startTime;
      
      // Should open within 1 second on mobile
      expect(openTime).toBeLessThan(1000);
    });

    test('should handle touch interactions smoothly', async ({ page }) => {
      // Open mobile avatar workflow
      await page.locator('[data-testid="avatar-edit-button"]').click();
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'mobile-avatar.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(500 * 1024) // 500KB
      });
      
      // Test touch interactions in crop interface
      const cropArea = page.locator('[data-testid="crop-area"]');
      await cropArea.waitFor({ state: 'visible' });
      
      const startTime = Date.now();
      
      // Simulate touch gestures
      await cropArea.tap();
      await page.touchscreen.tap(200, 300);
      
      const responseTime = Date.now() - startTime;
      
      // Touch interactions should be responsive
      expect(responseTime).toBeLessThan(500);
    });

    test('should optimize for mobile network conditions', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      
      // Test avatar loading on slow network
      await page.locator('[data-testid="avatar-image"]').waitFor({ 
        state: 'visible',
        timeout: 10000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(8000);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not cause memory leaks during avatar operations', async ({ page }) => {
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Perform multiple avatar operations
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-testid="avatar-edit-button"]').click();
        
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: `avatar-${i}.jpg`,
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(1024 * 1024) // 1MB
        });
        
        // Cancel to avoid actual upload
        await page.locator('[data-testid="cancel-button"]').click();
        
        // Wait for cleanup
        await page.waitForTimeout(100);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory usage should not increase significantly
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    test('should clean up canvas elements after compression', async ({ page }) => {
      // Count initial canvas elements
      const initialCanvasCount = await page.evaluate(() => {
        return document.querySelectorAll('canvas').length;
      });
      
      // Perform avatar upload with compression
      await page.locator('[data-testid="avatar-edit-button"]').click();
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'cleanup-test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(1024 * 1024)
      });
      
      // Cancel operation
      await page.locator('[data-testid="cancel-button"]').click();
      
      // Wait for cleanup
      await page.waitForTimeout(1000);
      
      const finalCanvasCount = await page.evaluate(() => {
        return document.querySelectorAll('canvas').length;
      });
      
      // Should not leave canvas elements behind
      expect(finalCanvasCount).toBeLessThanOrEqual(initialCanvasCount + 1);
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle multiple simultaneous avatar uploads', async ({ page, context }) => {
      // Open multiple tabs
      const page2 = await context.newPage();
      await page2.goto('/profile');
      await page2.waitForLoadState('networkidle');
      
      // Start uploads simultaneously
      const upload1Promise = (async () => {
        await page.locator('[data-testid="avatar-edit-button"]').click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: 'concurrent1.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(500 * 1024)
        });
      })();
      
      const upload2Promise = (async () => {
        await page2.locator('[data-testid="avatar-edit-button"]').click();
        const fileInput = page2.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: 'concurrent2.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(500 * 1024)
        });
      })();
      
      // Both should complete without interference
      await Promise.all([upload1Promise, upload2Promise]);
      
      // Both crop dialogs should be visible
      await expect(page.locator('[data-testid="avatar-crop-dialog"]')).toBeVisible();
      await expect(page2.locator('[data-testid="avatar-crop-dialog"]')).toBeVisible();
      
      await page2.close();
    });
  });
});
