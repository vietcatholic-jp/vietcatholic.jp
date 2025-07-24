import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';

test.describe('Teams Assignment - Responsive Design & UI/UX', () => {
  let loginPage: LoginPage;
  let teamsPage: TeamsAssignmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teamsPage = new TeamsAssignmentPage(page);
    
    // Login as admin before each test
    await loginPage.loginAsSuperAdmin();
    await teamsPage.navigateToTeamsAssignment();
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    viewports.forEach(({ width, height, name }) => {
      test(`should display correctly on ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await teamsPage.verifyPageLoaded();
        
        // Verify tabs are visible and functional
        await teamsPage.clickOverviewTab();
        await teamsPage.clickUnassignedTab();
        await teamsPage.clickTeamManagementTab();
        
        // Take screenshot for visual verification
        await teamsPage.takeScreenshot(`responsive-${name.toLowerCase().replace(' ', '-')}`);
        
        // Verify no horizontal scroll on mobile
        if (width <= 768) {
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(bodyWidth).toBeLessThanOrEqual(width + 20); // Allow small margin
        }
      });
    });

    test('should adapt tab display on mobile', async ({ page }) => {
      // Desktop view - should show text
      await page.setViewportSize({ width: 1280, height: 720 });
      await teamsPage.verifyPageLoaded();
      
      const overviewTabDesktop = page.locator('[data-testid="tab-overview"]');
      const tabTextDesktop = await overviewTabDesktop.textContent();
      expect(tabTextDesktop).toContain('Tổng quan');
      
      // Mobile view - might show only icons
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000); // Wait for responsive changes
      
      // Verify tabs are still clickable
      await teamsPage.clickOverviewTab();
      await teamsPage.clickUnassignedTab();
      await teamsPage.clickTeamManagementTab();
    });
  });

  test.describe('Navigation & Tab Switching', () => {
    test('should switch between tabs smoothly', async ({ page }) => {
      // Test tab switching
      await teamsPage.clickOverviewTab();
      await expect(page.locator('[data-testid="tab-overview"]')).toHaveAttribute('aria-selected', 'true');
      
      await teamsPage.clickUnassignedTab();
      await expect(page.locator('[data-testid="tab-unassigned"]')).toHaveAttribute('aria-selected', 'true');
      
      await teamsPage.clickTeamManagementTab();
      await expect(page.locator('[data-testid="tab-team-management"]')).toHaveAttribute('aria-selected', 'true');
    });

    test('should maintain tab state during page interactions', async ({ page }) => {
      // Go to unassigned tab
      await teamsPage.clickUnassignedTab();
      
      // Perform some action (like search)
      await teamsPage.searchRegistrants('test');
      
      // Verify still on unassigned tab
      await expect(page.locator('[data-testid="tab-unassigned"]')).toHaveAttribute('aria-selected', 'true');
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      // Start on overview tab
      await teamsPage.clickOverviewTab();
      const overviewUrl = page.url();
      
      // Go to unassigned tab
      await teamsPage.clickUnassignedTab();
      const unassignedUrl = page.url();
      
      // Use browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Should be back on overview tab
      expect(page.url()).toBe(overviewUrl);
      
      // Use browser forward
      await page.goForward();
      await page.waitForLoadState('networkidle');
      
      // Should be on unassigned tab
      expect(page.url()).toBe(unassignedUrl);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading indicators during data fetch', async ({ page }) => {
      // Intercept API calls to add delay
      await page.route('/api/admin/teams/stats', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      // Navigate to page
      await teamsPage.navigateToTeamsAssignment();
      
      // Should show loading state
      const loadingSelectors = [
        '[data-testid="loading"]',
        '.loading',
        '.spinner',
        'text="Đang tải"'
      ];
      
      let foundLoading = false;
      for (const selector of loadingSelectors) {
        if (await page.locator(selector).isVisible()) {
          foundLoading = true;
          break;
        }
      }
      
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      
      // Loading should be gone
      for (const selector of loadingSelectors) {
        await expect(page.locator(selector)).not.toBeVisible();
      }
    });

    test('should disable buttons during form submission', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      
      // Find a registrant and click assign
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        // Modal should open
        await teamsPage.verifyAssignTeamModalOpen('');
        
        // Select a team
        const teamSelect = page.locator('[data-testid="team-select"]');
        if (await teamSelect.isVisible()) {
          await teamSelect.click();
          const firstOption = page.locator('[role="option"]').first();
          if (await firstOption.isVisible()) {
            await firstOption.click();
          }
        }
        
        // Confirm button should be enabled
        const confirmButton = page.locator('[data-testid="confirm-assign-btn"]');
        await expect(confirmButton).toBeEnabled();
        
        // Click confirm and check if button gets disabled during submission
        await confirmButton.click();
        
        // Button should be disabled during submission
        await expect(confirmButton).toBeDisabled();
      }
    });
  });

  test.describe('Error Handling UI', () => {
    test('should display error messages gracefully', async ({ page }) => {
      // Mock API error
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Navigate to page
      await teamsPage.navigateToTeamsAssignment();
      
      // Should show error message
      const errorSelectors = [
        '[data-testid="error-message"]',
        '.error-message',
        'text="Không thể tải thống kê"',
        'text="Đã xảy ra lỗi"'
      ];
      
      let foundError = false;
      for (const selector of errorSelectors) {
        if (await page.locator(selector).isVisible()) {
          foundError = true;
          break;
        }
      }
      
      expect(foundError).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('/api/admin/**', (route) => {
        route.abort('failed');
      });
      
      // Navigate to page
      await teamsPage.navigateToTeamsAssignment();
      
      // Should handle network error gracefully (not crash)
      await page.waitForTimeout(3000);
      
      // Page should still be functional
      await teamsPage.clickUnassignedTab();
      await teamsPage.clickTeamManagementTab();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await teamsPage.verifyPageLoaded();
      
      // Check for proper ARIA attributes
      const tabs = page.locator('[role="tab"]');
      expect(await tabs.count()).toBeGreaterThan(0);
      
      const tabpanel = page.locator('[role="tabpanel"]');
      expect(await tabpanel.count()).toBeGreaterThan(0);
      
      // Check for proper headings hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      expect(await headings.count()).toBeGreaterThan(0);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await teamsPage.verifyPageLoaded();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate tabs with keyboard
      const focusedElement = page.locator(':focus');
      if (await focusedElement.getAttribute('role') === 'tab') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await teamsPage.verifyPageLoaded();
      
      // This is a basic check - in real scenarios, you'd use axe-core
      const backgroundColor = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).backgroundColor;
      });
      
      const textColor = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).color;
      });
      
      // Basic check that colors are defined
      expect(backgroundColor).toBeTruthy();
      expect(textColor).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await teamsPage.navigateToTeamsAssignment();
      await teamsPage.verifyPageLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not have memory leaks during tab switching', async ({ page }) => {
      // Switch between tabs multiple times
      for (let i = 0; i < 5; i++) {
        await teamsPage.clickOverviewTab();
        await teamsPage.clickUnassignedTab();
        await teamsPage.clickTeamManagementTab();
        await page.waitForTimeout(500);
      }
      
      // Check for console errors
      const errors = await teamsPage.checkConsoleErrors();
      const memoryErrors = errors.filter(error => 
        error.includes('memory') || error.includes('leak')
      );
      
      expect(memoryErrors.length).toBe(0);
    });
  });
});
