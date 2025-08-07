import { test, expect } from '@playwright/test';

/**
 * Avatar Upload E2E Tests
 * Tests the complete avatar upload workflow including:
 * - File selection and validation
 * - Crop functionality
 * - Compression and upload
 * - Error handling
 */

test.describe('Avatar Upload Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with avatar upload functionality
    // This would typically be a profile or registration page
    await page.goto('/profile');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display avatar placeholder when no avatar is set', async ({ page }) => {
    // Look for avatar placeholder
    const avatarPlaceholder = page.locator('[data-testid="avatar-placeholder"]');
    await expect(avatarPlaceholder).toBeVisible();
    
    // Should show initials or default icon
    const initials = avatarPlaceholder.locator('text');
    await expect(initials).toBeVisible();
  });

  test('should open upload dialog when clicking edit button', async ({ page }) => {
    // Click on avatar edit button
    const editButton = page.locator('[data-testid="avatar-edit-button"]');
    await editButton.click();
    
    // Check if upload dialog opens
    const uploadDialog = page.locator('[data-testid="avatar-upload-dialog"]');
    await expect(uploadDialog).toBeVisible();
    
    // Should have file input
    const fileInput = uploadDialog.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('should validate file type and size', async ({ page }) => {
    // Open upload dialog
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid file content')
    });
    
    // Should show error message
    const errorMessage = page.locator('[data-testid="file-error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('định dạng không hợp lệ');
  });

  test('should proceed to crop step after valid file upload', async ({ page }) => {
    // Open upload dialog
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    // Upload valid image file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content') // In real test, use actual image
    });
    
    // Should proceed to crop dialog
    const cropDialog = page.locator('[data-testid="avatar-crop-dialog"]');
    await expect(cropDialog).toBeVisible();
    
    // Should have crop controls
    const cropControls = cropDialog.locator('[data-testid="crop-controls"]');
    await expect(cropControls).toBeVisible();
  });

  test('should allow cropping and scaling image', async ({ page }) => {
    // Navigate through upload flow to crop step
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    });
    
    // Wait for crop dialog
    const cropDialog = page.locator('[data-testid="avatar-crop-dialog"]');
    await expect(cropDialog).toBeVisible();
    
    // Test zoom controls
    const zoomInButton = cropDialog.locator('[data-testid="zoom-in-button"]');
    const zoomOutButton = cropDialog.locator('[data-testid="zoom-out-button"]');
    
    await zoomInButton.click();
    await zoomOutButton.click();
    
    // Test rotation
    const rotateButton = cropDialog.locator('[data-testid="rotate-button"]');
    await rotateButton.click();
    
    // Confirm crop
    const confirmButton = cropDialog.locator('[data-testid="crop-confirm-button"]');
    await confirmButton.click();
  });

  test('should show processing dialog during upload', async ({ page }) => {
    // Complete upload flow
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    });
    
    // Proceed through crop
    const cropDialog = page.locator('[data-testid="avatar-crop-dialog"]');
    await expect(cropDialog).toBeVisible();
    
    const confirmButton = cropDialog.locator('[data-testid="crop-confirm-button"]');
    await confirmButton.click();
    
    // Should show processing dialog
    const processingDialog = page.locator('[data-testid="avatar-processing-dialog"]');
    await expect(processingDialog).toBeVisible();
    
    // Should show progress steps
    const progressSteps = processingDialog.locator('[data-testid="processing-step"]');
    await expect(progressSteps).toHaveCount(4); // Crop, Resize, Compress, Validate
  });

  test('should update avatar display after successful upload', async ({ page }) => {
    // Mock successful upload response
    await page.route('**/api/registrants/*/avatar', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          avatarUrl: 'https://example.com/avatar.jpg'
        })
      });
    });
    
    // Complete upload flow
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    });
    
    // Proceed through crop and processing
    const cropDialog = page.locator('[data-testid="avatar-crop-dialog"]');
    await expect(cropDialog).toBeVisible();
    
    const confirmButton = cropDialog.locator('[data-testid="crop-confirm-button"]');
    await confirmButton.click();
    
    // Wait for upload to complete
    await page.waitForResponse('**/api/registrants/*/avatar');
    
    // Should show success message
    const successToast = page.locator('[data-testid="success-toast"]');
    await expect(successToast).toBeVisible();
    
    // Avatar should be updated
    const avatarImage = page.locator('[data-testid="avatar-image"]');
    await expect(avatarImage).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock failed upload response
    await page.route('**/api/registrants/*/avatar', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Upload failed'
        })
      });
    });
    
    // Complete upload flow
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    });
    
    // Proceed through crop
    const cropDialog = page.locator('[data-testid="avatar-crop-dialog"]');
    await expect(cropDialog).toBeVisible();
    
    const confirmButton = cropDialog.locator('[data-testid="crop-confirm-button"]');
    await confirmButton.click();
    
    // Wait for upload to fail
    await page.waitForResponse('**/api/registrants/*/avatar');
    
    // Should show error message
    const errorToast = page.locator('[data-testid="error-toast"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toContainText('Upload failed');
  });

  test('should allow avatar deletion', async ({ page }) => {
    // Assume avatar exists
    const deleteButton = page.locator('[data-testid="avatar-delete-button"]');
    await deleteButton.click();
    
    // Should show confirmation dialog
    const confirmDialog = page.locator('[data-testid="delete-confirmation-dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    // Confirm deletion
    const confirmDeleteButton = confirmDialog.locator('[data-testid="confirm-delete-button"]');
    await confirmDeleteButton.click();
    
    // Should revert to placeholder
    const avatarPlaceholder = page.locator('[data-testid="avatar-placeholder"]');
    await expect(avatarPlaceholder).toBeVisible();
  });
});

test.describe('Mobile Avatar Upload', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('should use mobile workflow on small screens', async ({ page }) => {
    await page.goto('/profile');
    
    // Click avatar edit
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    // Should open mobile sheet instead of dialog
    const mobileSheet = page.locator('[data-testid="mobile-avatar-sheet"]');
    await expect(mobileSheet).toBeVisible();
    
    // Should have touch-friendly controls
    const touchControls = mobileSheet.locator('[data-testid="touch-controls"]');
    await expect(touchControls).toBeVisible();
  });

  test('should support touch gestures for cropping', async ({ page }) => {
    await page.goto('/profile');
    
    // Navigate to crop step
    await page.locator('[data-testid="avatar-edit-button"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    });
    
    // Should show mobile crop interface
    const mobileCrop = page.locator('[data-testid="mobile-crop-interface"]');
    await expect(mobileCrop).toBeVisible();
    
    // Should have pinch-to-zoom capability
    const cropArea = mobileCrop.locator('[data-testid="crop-area"]');
    await expect(cropArea).toBeVisible();
  });
});
