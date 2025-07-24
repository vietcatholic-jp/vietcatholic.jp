import { chromium, FullConfig } from '@playwright/test';

/**
 * Global teardown for Teams Assignment tests
 * This runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test data if needed
    console.log('🗑️  Cleaning up test data...');
    
    // Create browser instance for cleanup
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Login as admin for cleanup operations
      await page.goto('http://localhost:3000/auth/sign-in');
      await page.fill('input[type="email"]', 'dev.thubv@gmail.com');
      await page.fill('input[type="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Clean up any test teams created during testing
      console.log('🧹 Cleaning up test teams...');
      
      // Navigate to teams management
      await page.goto('http://localhost:3000/admin/teams-assignment');
      await page.click('[data-testid="tab-team-management"]');
      await page.waitForLoadState('networkidle');
      
      // Find and delete test teams
      const testTeams = page.locator('[data-testid="team-card"]:has-text("Test")');
      const testTeamCount = await testTeams.count();
      
      for (let i = 0; i < testTeamCount; i++) {
        const deleteBtn = testTeams.nth(i).locator('[data-testid="delete-team-btn"]');
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          
          const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
          if (await confirmDialog.isVisible()) {
            const confirmBtn = confirmDialog.locator('[data-testid="confirm-delete-btn"]');
            await confirmBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
      
      console.log(`🗑️  Cleaned up ${testTeamCount} test teams`);
      
    } catch (error) {
      console.log('⚠️  Cleanup operations failed (this is usually okay):', error);
    } finally {
      await context.close();
      await browser.close();
    }
    
    // Generate test report summary
    console.log('📊 Generating test report summary...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Create summary report
    const reportSummary = {
      timestamp: new Date().toISOString(),
      testSuite: 'Teams Assignment E2E Tests',
      environment: process.env.NODE_ENV || 'test',
      baseUrl: 'http://localhost:3000',
      testCategories: [
        'Authentication & Authorization',
        'UI/UX & Responsive Design',
        'Tab Functionality (Overview, Unassigned, Team Management)',
        'Modal Operations (Assign Team)',
        'API Integration',
        'Edge Cases & Error Handling'
      ],
      reportLocations: {
        html: 'tests/reports/html/index.html',
        json: 'tests/reports/results.json',
        junit: 'tests/reports/results.xml',
        screenshots: 'tests/reports/screenshots/',
        videos: 'tests/reports/videos/',
        traces: 'tests/reports/traces/'
      }
    };
    
    const summaryPath = 'tests/reports/test-summary.json';
    fs.writeFileSync(summaryPath, JSON.stringify(reportSummary, null, 2));
    console.log(`📄 Test summary saved to: ${summaryPath}`);
    
    // Clean up old screenshots and videos (keep only last 10 runs)
    console.log('🧹 Cleaning up old test artifacts...');
    
    const cleanupDirs = ['screenshots', 'videos', 'traces'];
    
    cleanupDirs.forEach(dir => {
      const dirPath = `tests/reports/${dir}`;
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
          .map(file => ({
            name: file,
            path: path.join(dirPath, file),
            time: fs.statSync(path.join(dirPath, file)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);
        
        // Keep only the 50 most recent files
        const filesToDelete = files.slice(50);
        
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.log(`⚠️  Could not delete ${file.path}:`, error);
          }
        });
        
        console.log(`🗑️  Cleaned up ${filesToDelete.length} old files from ${dir}`);
      }
    });
    
    console.log('✅ Global teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the entire test suite
  }
}

export default globalTeardown;
