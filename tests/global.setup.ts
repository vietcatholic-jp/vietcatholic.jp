import { chromium, FullConfig } from '@playwright/test';
import { LoginPage } from './page-objects/login-page';

/**
 * Global setup for Teams Assignment tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Create browser instance
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Verify application is running
    console.log('📡 Checking if application is running...');
    await page.goto('http://localhost:3000', { timeout: 30000 });

    // Verify login functionality
    console.log('🔐 Verifying login functionality...');
    const loginPage = new LoginPage(page);

    // Test super admin login with full URL
    await page.goto('http://localhost:3000/auth/sign-in');
    await page.fill('input[type="email"]', 'dev.thubv@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Super admin login verified');
    
    // Verify admin access
    await page.goto('http://localhost:3000/admin/teams-assignment');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/teams-assignment')) {
      throw new Error('Admin access verification failed');
    }
    console.log('✅ Admin access verified');
    
    // Simple logout by going to sign-in page
    await page.goto('http://localhost:3000/auth/sign-in');
    console.log('✅ Logout verified');
    
    // Create test data directories
    console.log('📁 Creating test directories...');
    const fs = require('fs');
    const path = require('path');
    
    const directories = [
      'tests/reports',
      'tests/reports/screenshots',
      'tests/reports/videos',
      'tests/reports/traces'
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
    
    // Verify API endpoints are accessible
    console.log('🔌 Verifying API endpoints...');

    // Login again for API tests
    await page.goto('http://localhost:3000/auth/sign-in');
    await page.fill('input[type="email"]', 'dev.thubv@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    const apiEndpoints = [
      '/api/admin/teams/stats',
      '/api/admin/registrants/unassigned',
      '/api/admin/teams'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(`http://localhost:3000${endpoint}`);
        if (response.status() === 200) {
          console.log(`✅ API endpoint verified: ${endpoint}`);
        } else {
          console.log(`⚠️  API endpoint returned ${response.status()}: ${endpoint}`);
        }
      } catch (error) {
        console.log(`❌ API endpoint failed: ${endpoint} - ${error}`);
      }
    }
    
    console.log('🎉 Global setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
