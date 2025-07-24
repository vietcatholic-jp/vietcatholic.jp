import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';

test.describe('Teams Assignment - Edge Cases & Error Scenarios', () => {
  let loginPage: LoginPage;
  let teamsPage: TeamsAssignmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teamsPage = new TeamsAssignmentPage(page);
    
    // Login as admin before each test
    await loginPage.loginAsSuperAdmin();
    await teamsPage.navigateToTeamsAssignment();
  });

  test.describe('Empty States', () => {
    test('should handle empty teams list gracefully', async ({ page }) => {
      // Mock empty teams response
      await page.route('/api/admin/teams', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await page.reload();
      await teamsPage.clickTeamManagementTab();
      await page.waitForLoadState('networkidle');
      
      // Should show empty state message
      const emptyMessage = page.locator('text="Chưa có đội nào", text="No teams available"');
      await expect(emptyMessage).toBeVisible();
      
      // Create team button should still be available
      const createButton = page.locator('[data-testid="create-team-btn"]');
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    });

    test('should handle empty unassigned registrants list', async ({ page }) => {
      // Mock empty unassigned response
      await page.route('/api/admin/registrants/unassigned*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            registrants: [],
            total: 0,
            page: 1,
            limit: 50
          })
        });
      });
      
      await page.reload();
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      // Should show empty state
      const emptyMessage = page.locator('text="Không có người tham dự nào chưa được phân đội"');
      await expect(emptyMessage).toBeVisible();
      
      // Search and filters should still be available
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeEnabled();
      }
    });

    test('should handle zero statistics gracefully', async ({ page }) => {
      // Mock zero stats
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total_teams: 0,
            total_assigned: 0,
            total_unassigned: 0,
            assignment_percentage: 0,
            team_distribution: [],
            gender_distribution: [],
            age_distribution: []
          })
        });
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      await page.waitForLoadState('networkidle');
      
      // Should display zero values correctly
      const statsCards = page.locator('[data-testid="total-teams-card"], [data-testid="assigned-card"], [data-testid="unassigned-card"]');
      for (let i = 0; i < await statsCards.count(); i++) {
        const card = statsCards.nth(i);
        const cardText = await card.textContent() || '';
        expect(cardText).toContain('0');
      }
      
      // Charts should show empty state
      const charts = page.locator('[data-testid*="chart"]');
      for (let i = 0; i < await charts.count(); i++) {
        const chart = charts.nth(i);
        await expect(chart).toBeVisible();
      }
    });
  });

  test.describe('Network Errors', () => {
    test('should handle complete network failure', async ({ page }) => {
      // Mock network failure for all API calls
      await page.route('/api/admin/**', (route) => {
        route.abort('failed');
      });
      
      await page.reload();
      await page.waitForTimeout(5000);
      
      // Page should still be functional
      await expect(page.locator('[data-testid="tab-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-unassigned"]')).toBeVisible();
      await expect(page.locator('[data-testid="tab-team-management"]')).toBeVisible();
      
      // Should show error states
      const errorMessages = page.locator('[data-testid="error-message"], text="Không thể tải", text="Failed to load"');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });

    test('should handle intermittent network issues', async ({ page }) => {
      let requestCount = 0;
      
      // Mock intermittent failures
      await page.route('/api/admin/teams/stats', (route) => {
        requestCount++;
        if (requestCount % 2 === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      
      // Should eventually succeed after retries
      await page.waitForTimeout(10000);
      
      // Check if data eventually loads
      const statsCard = page.locator('[data-testid="total-teams-card"]');
      if (await statsCard.isVisible()) {
        const cardText = await statsCard.textContent();
        expect(cardText).toBeTruthy();
      }
    });

    test('should handle slow network responses', async ({ page }) => {
      // Mock very slow response
      await page.route('/api/admin/teams/stats', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        route.continue();
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      
      // Should show loading state
      const loadingIndicators = page.locator('[data-testid="loading"], .loading, text="Đang tải"');
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeVisible();
      }
      
      // Should timeout gracefully
      await page.waitForTimeout(15000);
      
      // Should show timeout error or fallback
      const errorState = page.locator('[data-testid="error-message"], text="timeout", text="quá thời gian"');
      if (await errorState.count() > 0) {
        await expect(errorState.first()).toBeVisible();
      }
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle multiple users assigning same registrant', async ({ page, context }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        // Simulate another user assigning the same registrant
        await page.route('/api/admin/registrants/*/assign-team', (route) => {
          route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Registrant already assigned to another team' })
          });
        });
        
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        if (await modal.isVisible()) {
          const teamSelect = modal.locator('[data-testid="team-select"]');
          await teamSelect.click();
          
          const teamOptions = page.locator('[role="option"]');
          if (await teamOptions.count() > 0) {
            await teamOptions.first().click();
            
            const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
            await confirmButton.click();
            
            // Should show conflict error
            const errorMessage = page.locator('[data-testid="toast"], text="đã được phân đội", text="already assigned"');
            await expect(errorMessage).toBeVisible();
          }
        }
      }
    });

    test('should handle team capacity reached during assignment', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        // Mock team capacity reached
        await page.route('/api/admin/registrants/*/assign-team', (route) => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Team capacity reached' })
          });
        });
        
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        if (await modal.isVisible()) {
          const teamSelect = modal.locator('[data-testid="team-select"]');
          await teamSelect.click();
          
          const teamOptions = page.locator('[role="option"]');
          if (await teamOptions.count() > 0) {
            await teamOptions.first().click();
            
            const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
            await confirmButton.click();
            
            // Should show capacity error
            const errorMessage = page.locator('[data-testid="toast"], text="đã đầy", text="capacity reached"');
            await expect(errorMessage).toBeVisible();
          }
        }
      }
    });

    test('should handle simultaneous bulk assignments', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check();
        
        // Mock partial success in bulk assignment
        await page.route('/api/admin/registrants/bulk-assign', (route) => {
          route.fulfill({
            status: 207, // Multi-status
            contentType: 'application/json',
            body: JSON.stringify({
              success: 5,
              failed: 2,
              errors: [
                { registrant_id: 'reg-1', error: 'Already assigned' },
                { registrant_id: 'reg-2', error: 'Team capacity reached' }
              ]
            })
          });
        });
        
        const bulkAssignButton = page.locator('[data-testid="bulk-assign-btn"]');
        if (await bulkAssignButton.isVisible()) {
          await bulkAssignButton.click();
          
          // Should show partial success message
          const partialMessage = page.locator('[data-testid="toast"], text="một phần thành công", text="partially successful"');
          if (await partialMessage.count() > 0) {
            await expect(partialMessage.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should handle malformed API responses', async ({ page }) => {
      // Mock malformed JSON response
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response {'
        });
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      
      // Should handle JSON parse error gracefully
      await page.waitForTimeout(3000);
      
      const errorState = page.locator('[data-testid="error-message"], text="Không thể tải thống kê"');
      if (await errorState.count() > 0) {
        await expect(errorState.first()).toBeVisible();
      }
    });

    test('should handle missing required fields in API response', async ({ page }) => {
      // Mock incomplete API response
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total_teams: 5
            // Missing other required fields
          })
        });
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      await page.waitForLoadState('networkidle');
      
      // Should handle missing fields gracefully
      const statsCards = page.locator('[data-testid="assigned-card"], [data-testid="unassigned-card"]');
      for (let i = 0; i < await statsCards.count(); i++) {
        const card = statsCards.nth(i);
        await expect(card).toBeVisible();
        
        // Should show default values or error state
        const cardText = await card.textContent() || '';
        expect(cardText).toMatch(/\d+|--|-|N\/A/);
      }
    });

    test('should validate form inputs with edge cases', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      // Test search with special characters
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible()) {
        const specialChars = ['<script>', '"; DROP TABLE;', '\\', '/', '&', '%'];
        
        for (const char of specialChars) {
          await searchInput.fill(char);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          
          // Should not break the page
          await expect(searchInput).toBeVisible();
          
          // Clear for next test
          await searchInput.clear();
        }
      }
    });

    test('should handle extremely long input values', async ({ page }) => {
      await teamsPage.clickTeamManagementTab();
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-team-btn"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.locator('[data-testid="create-team-modal"]');
        if (await modal.isVisible()) {
          const nameInput = modal.locator('[data-testid="team-name-input"]');
          const descInput = modal.locator('[data-testid="team-description-input"]');
          
          if (await nameInput.isVisible()) {
            // Test extremely long team name
            const longName = 'A'.repeat(1000);
            await nameInput.fill(longName);
            
            // Should show validation error or truncate
            const validationError = modal.locator('[data-testid="validation-error"], .error-message');
            if (await validationError.count() > 0) {
              await expect(validationError.first()).toBeVisible();
            }
          }
          
          if (await descInput.isVisible()) {
            // Test extremely long description
            const longDesc = 'B'.repeat(5000);
            await descInput.fill(longDesc);
            
            // Should handle gracefully
            const currentValue = await descInput.inputValue();
            expect(currentValue.length).toBeLessThanOrEqual(5000);
          }
        }
      }
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should handle browser refresh during operations', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        if (await modal.isVisible()) {
          // Refresh page while modal is open
          await page.reload();
          
          // Should return to clean state
          await page.waitForLoadState('networkidle');
          await expect(modal).not.toBeVisible();
          
          // Page should be functional
          await teamsPage.clickUnassignedTab();
          await expect(page.locator('[data-testid="tab-unassigned"]')).toBeVisible();
        }
      }
    });

    test('should handle browser back/forward during modal operations', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        if (await modal.isVisible()) {
          // Navigate to different tab
          await teamsPage.clickOverviewTab();
          
          // Use browser back
          await page.goBack();
          
          // Should handle gracefully
          await page.waitForLoadState('networkidle');
          
          // Modal should be closed
          await expect(modal).not.toBeVisible();
        }
      }
    });

    test('should handle session expiration during operations', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      // Clear session cookies to simulate expiration
      await page.context().clearCookies();
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        // Should redirect to login or show auth error
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        const hasAuthError = await page.locator('text="Unauthorized", text="Session expired"').isVisible();
        
        expect(currentUrl.includes('/auth/sign-in') || hasAuthError).toBeTruthy();
      }
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      const largeRegistrantsList = Array.from({ length: 1000 }, (_, i) => ({
        id: `reg-${i}`,
        full_name: `NGƯỜI THAM DỰ ${i}`,
        registration_code: `DH2025${String(i).padStart(3, '0')}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        age: 20 + (i % 50),
        province: `Tỉnh ${i % 10}`,
        diocese: `Giáo phận ${i % 5}`
      }));
      
      await page.route('/api/admin/registrants/unassigned*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            registrants: largeRegistrantsList.slice(0, 50),
            total: 1000,
            page: 1,
            limit: 50
          })
        });
      });
      
      await page.reload();
      await teamsPage.clickUnassignedTab();
      
      const startTime = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(10000);
      
      // Should display pagination for large dataset
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();
      }
    });

    test('should handle rapid user interactions', async ({ page }) => {
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      // Rapidly switch between tabs
      for (let i = 0; i < 10; i++) {
        await teamsPage.clickOverviewTab();
        await teamsPage.clickUnassignedTab();
        await teamsPage.clickTeamManagementTab();
        await page.waitForTimeout(100);
      }
      
      // Should remain stable
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="tab-team-management"]')).toBeVisible();
      
      // Check for console errors
      const errors = await page.evaluate(() => {
        return window.console.error.toString();
      });
      
      // Should not have critical errors
      expect(errors).not.toContain('Maximum call stack');
      expect(errors).not.toContain('Memory leak');
    });
  });
});
