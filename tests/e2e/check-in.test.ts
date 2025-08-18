import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login-page';
import { RegistrationPage } from '../page-objects/registration-page';
import { CheckInPage } from '../page-objects/check-in-page';
import { createTestUser, cleanupTestUser } from '../utils/test-helpers';

test.describe('Check-in Feature', () => {
  let testUserEmail: string;
  let testPassword: string;

  test.beforeEach(async () => {
    // Create test user with registration_manager role
    const testUser = await createTestUser('registration_manager');
    testUserEmail = testUser.email;
    testPassword = testUser.password;
  });

  test.afterEach(async () => {
    // Cleanup test user
    await cleanupTestUser(testUserEmail);
  });

  test('should show check-in button for registration managers', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Login as registration manager
    await loginPage.goto();
    await loginPage.login(testUserEmail, testPassword);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should see check-in button
    await expect(page.locator('text=Check-in')).toBeVisible();
    
    // Click check-in button
    await page.click('text=Check-in');
    await expect(page).toHaveURL('/check-in');
  });

  test('should not show check-in button for regular participants', async ({ page }) => {
    // Create regular participant user
    const participantUser = await createTestUser('participant');
    
    try {
      const loginPage = new LoginPage(page);
      
      // Login as participant
      await loginPage.goto();
      await loginPage.login(participantUser.email, participantUser.password);
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should NOT see check-in button
      await expect(page.locator('text=Check-in')).not.toBeVisible();
      
      // Direct access to check-in should redirect to dashboard
      await page.goto('/check-in');
      await expect(page).toHaveURL('/dashboard');
      
    } finally {
      await cleanupTestUser(participantUser.email);
    }
  });

  test('should load check-in scanner page correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const checkInPage = new CheckInPage(page);
    
    // Login and navigate to check-in
    await loginPage.goto();
    await loginPage.login(testUserEmail, testPassword);
    await checkInPage.goto();
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Check-in Tham Gia Sự Kiện');
    await expect(checkInPage.startScanButton).toBeVisible();
    await expect(checkInPage.cameraView).toBeVisible();
    
    // Check stats cards
    await expect(page.locator('text=Đã Check-in')).toBeVisible();
    await expect(page.locator('text=Lần quét cuối')).toBeVisible();
    await expect(page.locator('text=Trạng thái')).toBeVisible();
  });

  test('should handle camera permission request', async ({ page, context }) => {
    // Grant camera permission
    await context.grantPermissions(['camera']);
    
    const loginPage = new LoginPage(page);
    const checkInPage = new CheckInPage(page);
    
    await loginPage.goto();
    await loginPage.login(testUserEmail, testPassword);
    await checkInPage.goto();
    
    // Start scanning
    await checkInPage.startScanning();
    
    // Check if scanning started
    await expect(checkInPage.stopScanButton).toBeVisible();
    await expect(page.locator('text=Đang quét')).toBeVisible();
    
    // Stop scanning
    await checkInPage.stopScanning();
    await expect(checkInPage.startScanButton).toBeVisible();
  });

  test('should handle invalid QR code', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    
    const loginPage = new LoginPage(page);
    const checkInPage = new CheckInPage(page);
    
    await loginPage.goto();
    await loginPage.login(testUserEmail, testPassword);
    await checkInPage.goto();
    
    // Mock QR scan with invalid data
    await page.evaluate(() => {
      // Simulate invalid QR code scan
      const mockQRData = 'invalid-qr-code-data';
      window.dispatchEvent(new CustomEvent('mock-qr-scan', { 
        detail: { qrData: mockQRData } 
      }));
    });
    
    // Should show error dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Lỗi check-in')).toBeVisible();
    await expect(page.locator('text=Mã QR không hợp lệ')).toBeVisible();
    
    // Close dialog
    await page.click('text=Tiếp tục quét');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle successful check-in', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    
    // First create a test registration with confirmed payment
    const testRegistrant = await createTestRegistrant();
    
    try {
      const loginPage = new LoginPage(page);
      const checkInPage = new CheckInPage(page);
      
      await loginPage.goto();
      await loginPage.login(testUserEmail, testPassword);
      await checkInPage.goto();
      
      // Mock QR scan with valid registrant data
      await page.evaluate((registrantId) => {
        const mockQRData = JSON.stringify({
          id: registrantId,
          name: 'Test User',
          event: 'Đại hội Công giáo Việt Nam 2025'
        });
        window.dispatchEvent(new CustomEvent('mock-qr-scan', { 
          detail: { qrData: mockQRData } 
        }));
      }, testRegistrant.id);
      
      // Should show success dialog
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Check-in thành công!')).toBeVisible();
      await expect(page.locator(`text=${testRegistrant.full_name}`)).toBeVisible();
      
      // Check-in count should increase
      await page.click('text=Hoàn tất');
      await expect(page.locator('text=1', { exact: true })).toBeVisible(); // Check-in count
      
    } finally {
      await cleanupTestRegistrant(testRegistrant.id);
    }
  });

  test('should prevent duplicate check-in', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    
    // Create a test registrant that's already checked in
    const testRegistrant = await createTestRegistrant({ is_checked_in: true });
    
    try {
      const loginPage = new LoginPage(page);
      const checkInPage = new CheckInPage(page);
      
      await loginPage.goto();
      await loginPage.login(testUserEmail, testPassword);
      await checkInPage.goto();
      
      // Mock QR scan with already checked-in registrant
      await page.evaluate((registrantId) => {
        const mockQRData = JSON.stringify({
          id: registrantId,
          name: 'Test User',
          event: 'Đại hội Công giáo Việt Nam 2025'
        });
        window.dispatchEvent(new CustomEvent('mock-qr-scan', { 
          detail: { qrData: mockQRData } 
        }));
      }, testRegistrant.id);
      
      // Should show error dialog indicating already checked in
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Lỗi check-in')).toBeVisible();
      await expect(page.locator('text=đã check-in trước đó')).toBeVisible();
      
    } finally {
      await cleanupTestRegistrant(testRegistrant.id);
    }
  });

  test('should handle unconfirmed registration', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    
    // Create a test registrant with unconfirmed registration
    const testRegistrant = await createTestRegistrant({ registration_status: 'pending' });
    
    try {
      const loginPage = new LoginPage(page);
      const checkInPage = new CheckInPage(page);
      
      await loginPage.goto();
      await loginPage.login(testUserEmail, testPassword);
      await checkInPage.goto();
      
      // Mock QR scan
      await page.evaluate((registrantId) => {
        const mockQRData = JSON.stringify({
          id: registrantId,
          name: 'Test User',
          event: 'Đại hội Công giáo Việt Nam 2025'
        });
        window.dispatchEvent(new CustomEvent('mock-qr-scan', { 
          detail: { qrData: mockQRData } 
        }));
      }, testRegistrant.id);
      
      // Should show error dialog about unconfirmed payment
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Lỗi check-in')).toBeVisible();
      await expect(page.locator('text=chưa được xác nhận thanh toán')).toBeVisible();
      
    } finally {
      await cleanupTestRegistrant(testRegistrant.id);
    }
  });
});

// Helper functions for test data creation
async function createTestRegistrant(options: {
  is_checked_in?: boolean;
  registration_status?: string;
} = {}) {
  // This would use your test database setup
  // Implementation depends on your test environment setup
  return {
    id: 'test-registrant-id',
    full_name: 'Test Registrant',
    email: 'test@example.com',
    diocese: 'Test Diocese',
    is_checked_in: options.is_checked_in || false,
    registration_status: options.registration_status || 'confirmed'
  };
}

async function cleanupTestRegistrant(registrantId: string) {
  // Clean up test registrant data
  // Implementation depends on your test environment setup
}
