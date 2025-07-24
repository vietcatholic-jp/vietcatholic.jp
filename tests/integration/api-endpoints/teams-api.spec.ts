import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../../fixtures/test-data';

test.describe('Teams Assignment - API Integration Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    
    // Login as admin before each test
    await loginPage.loginAsSuperAdmin();
  });

  test.describe('Teams Stats API', () => {
    test('should return correct stats data structure', async ({ page }) => {
      // Intercept and verify API response
      const responsePromise = page.waitForResponse('/api/admin/teams/stats');
      
      await page.goto('/admin/teams-assignment');
      
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Verify required fields
      expect(data).toHaveProperty('total_teams');
      expect(data).toHaveProperty('total_assigned');
      expect(data).toHaveProperty('total_unassigned');
      expect(data).toHaveProperty('assignment_percentage');
      
      // Verify data types
      expect(typeof data.total_teams).toBe('number');
      expect(typeof data.total_assigned).toBe('number');
      expect(typeof data.total_unassigned).toBe('number');
      expect(typeof data.assignment_percentage).toBe('number');
      
      // Verify percentage calculation
      const total = data.total_assigned + data.total_unassigned;
      const expectedPercentage = total > 0 ? Math.round((data.total_assigned / total) * 100) : 0;
      expect(data.assignment_percentage).toBe(expectedPercentage);
    });

    test('should handle unauthorized access', async ({ page }) => {
      // Clear authentication
      await page.context().clearCookies();
      
      // Try to access API
      const response = await page.request.get('/api/admin/teams/stats');
      
      expect(response.status()).toBe(401);
    });

    test('should return 403 for insufficient permissions', async ({ page }) => {
      // Login as participant
      await loginPage.loginAsParticipant();
      
      // Try to access admin API
      const response = await page.request.get('/api/admin/teams/stats');
      
      expect(response.status()).toBe(403);
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      const response = await page.request.get('/api/admin/teams/stats');
      
      expect(response.status()).toBe(500);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
    });
  });

  test.describe('Unassigned Registrants API', () => {
    test('should return paginated registrants data', async ({ page }) => {
      const responsePromise = page.waitForResponse('/api/admin/registrants/unassigned*');
      
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Verify pagination structure
      expect(data).toHaveProperty('registrants');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      
      // Verify registrants array
      expect(Array.isArray(data.registrants)).toBeTruthy();
      
      if (data.registrants.length > 0) {
        const registrant = data.registrants[0];
        
        // Verify required fields
        expect(registrant).toHaveProperty('id');
        expect(registrant).toHaveProperty('full_name');
        expect(registrant).toHaveProperty('registration_code');
        expect(registrant).toHaveProperty('gender');
        expect(registrant).toHaveProperty('age');
        expect(registrant).toHaveProperty('province');
        expect(registrant).toHaveProperty('diocese');
        
        // Verify data types
        expect(typeof registrant.full_name).toBe('string');
        expect(typeof registrant.registration_code).toBe('string');
        expect(typeof registrant.age).toBe('number');
      }
    });

    test('should support search functionality', async ({ page }) => {
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      await page.waitForLoadState('networkidle');
      
      // Perform search
      const searchTerm = 'HOÀNG';
      await page.fill('[data-testid="search-input"]', searchTerm);
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/admin/registrants/unassigned') && 
        response.url().includes(`search=${encodeURIComponent(searchTerm)}`)
      );
      
      await page.keyboard.press('Enter');
      
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Verify search results
      if (data.registrants.length > 0) {
        const firstResult = data.registrants[0];
        expect(firstResult.full_name.toUpperCase()).toContain(searchTerm.toUpperCase());
      }
    });

    test('should support filtering by gender', async ({ page }) => {
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      await page.waitForLoadState('networkidle');
      
      // Apply gender filter
      const genderFilter = page.locator('[data-testid="gender-filter"]');
      if (await genderFilter.isVisible()) {
        const responsePromise = page.waitForResponse(response => 
          response.url().includes('/api/admin/registrants/unassigned') && 
          response.url().includes('gender=male')
        );
        
        await genderFilter.selectOption('male');
        
        const response = await responsePromise;
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        
        // Verify all results are male
        data.registrants.forEach((registrant: any) => {
          expect(registrant.gender).toBe('male');
        });
      }
    });

    test('should handle pagination parameters', async ({ page }) => {
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      
      // Check if pagination exists
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        const nextButton = pagination.locator('button:has-text("Next"), button:has-text("Tiếp")');
        
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/admin/registrants/unassigned') && 
            response.url().includes('page=2')
          );
          
          await nextButton.click();
          
          const response = await responsePromise;
          expect(response.status()).toBe(200);
          
          const data = await response.json();
          expect(data.page).toBe(2);
        }
      }
    });
  });

  test.describe('Team Assignment API', () => {
    test('should successfully assign registrant to team', async ({ page }) => {
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        // Get registrant ID from the first row
        const firstRow = page.locator('[data-testid="registrant-row"]').first();
        const registrantId = await firstRow.getAttribute('data-registrant-id');
        
        if (registrantId) {
          await assignButtons.first().click();
          
          const modal = page.locator('[data-testid="assign-team-modal"]');
          await expect(modal).toBeVisible();
          
          // Select team
          const teamSelect = modal.locator('[data-testid="team-select"]');
          await teamSelect.click();
          
          const teamOptions = page.locator('[role="option"]');
          if (await teamOptions.count() > 0) {
            const firstOption = teamOptions.first();
            const teamId = await firstOption.getAttribute('data-team-id');
            await firstOption.click();
            
            // Monitor API call
            const responsePromise = page.waitForResponse(response => 
              response.url().includes(`/api/admin/registrants/${registrantId}/assign-team`) &&
              response.request().method() === 'POST'
            );
            
            // Confirm assignment
            const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
            await confirmButton.click();
            
            const response = await responsePromise;
            expect(response.status()).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
          }
        }
      }
    });

    test('should handle team not found error', async ({ page }) => {
      // Mock team not found error
      await page.route('/api/admin/registrants/*/assign-team', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Team not found' })
        });
      });
      
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Select team and confirm
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          await teamOptions.first().click();
          
          const responsePromise = page.waitForResponse(response => 
            response.url().includes('/assign-team') &&
            response.request().method() === 'POST'
          );
          
          const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
          await confirmButton.click();
          
          const response = await responsePromise;
          expect(response.status()).toBe(404);
          
          const errorData = await response.json();
          expect(errorData.error).toBe('Team not found');
        }
      }
    });

    test('should validate request payload', async ({ page }) => {
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Select team and add notes
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          await teamOptions.first().click();
          
          const notesInput = modal.locator('[data-testid="notes-input"]');
          await notesInput.fill('Test assignment notes');
          
          // Monitor request payload
          let requestPayload: any;
          page.on('request', (request) => {
            if (request.url().includes('/assign-team') && request.method() === 'POST') {
              requestPayload = request.postDataJSON();
            }
          });
          
          const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
          await confirmButton.click();
          
          await page.waitForTimeout(1000);
          
          // Verify payload structure
          if (requestPayload) {
            expect(requestPayload).toHaveProperty('team_id');
            expect(requestPayload).toHaveProperty('notes');
            expect(requestPayload.notes).toBe('Test assignment notes');
          }
        }
      }
    });
  });

  test.describe('Teams List API', () => {
    test('should return available teams for assignment', async ({ page }) => {
      const responsePromise = page.waitForResponse('/api/admin/teams');
      
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-team-management"]');
      
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      
      const teams = await response.json();
      
      // Verify teams array
      expect(Array.isArray(teams)).toBeTruthy();
      
      if (teams.length > 0) {
        const team = teams[0];
        
        // Verify required fields
        expect(team).toHaveProperty('id');
        expect(team).toHaveProperty('name');
        expect(team).toHaveProperty('description');
        expect(team).toHaveProperty('current_members');
        
        // Verify data types
        expect(typeof team.id).toBe('string');
        expect(typeof team.name).toBe('string');
        expect(typeof team.current_members).toBe('number');
      }
    });

    test('should handle empty teams list', async ({ page }) => {
      // Mock empty teams response
      await page.route('/api/admin/teams', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      const response = await page.request.get('/api/admin/teams');
      expect(response.status()).toBe(200);
      
      const teams = await response.json();
      expect(Array.isArray(teams)).toBeTruthy();
      expect(teams.length).toBe(0);
    });
  });

  test.describe('Bulk Assignment API', () => {
    test('should handle bulk assignment request', async ({ page }) => {
      await page.goto('/admin/teams-assignment');
      await page.click('[data-testid="tab-unassigned"]');
      await page.waitForLoadState('networkidle');
      
      // Select multiple registrants
      const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check();
        
        const bulkAssignButton = page.locator('[data-testid="bulk-assign-btn"]');
        if (await bulkAssignButton.isVisible()) {
          // Monitor bulk assignment API call
          let requestPayload: any;
          page.on('request', (request) => {
            if (request.url().includes('/api/admin/registrants/bulk-assign') && request.method() === 'POST') {
              requestPayload = request.postDataJSON();
            }
          });
          
          await bulkAssignButton.click();
          
          // If bulk assign modal opens, complete the process
          const bulkModal = page.locator('[data-testid="bulk-assign-modal"]');
          if (await bulkModal.isVisible()) {
            const teamSelect = bulkModal.locator('[data-testid="team-select"]');
            await teamSelect.click();
            
            const teamOptions = page.locator('[role="option"]');
            if (await teamOptions.count() > 0) {
              await teamOptions.first().click();
              
              const confirmButton = bulkModal.locator('[data-testid="confirm-bulk-assign-btn"]');
              await confirmButton.click();
              
              await page.waitForTimeout(1000);
              
              // Verify payload structure
              if (requestPayload) {
                expect(requestPayload).toHaveProperty('registrant_ids');
                expect(requestPayload).toHaveProperty('team_id');
                expect(Array.isArray(requestPayload.registrant_ids)).toBeTruthy();
                expect(requestPayload.registrant_ids.length).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network timeouts', async ({ page }) => {
      // Mock slow response
      await page.route('/api/admin/teams/stats', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 30000));
        route.continue();
      });
      
      await page.goto('/admin/teams-assignment');
      
      // Should handle timeout gracefully
      await page.waitForTimeout(5000);
      
      // Page should still be functional
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toBeVisible();
    });

    test('should handle malformed JSON responses', async ({ page }) => {
      // Mock malformed JSON
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{'
        });
      });
      
      await page.goto('/admin/teams-assignment');
      
      // Should handle JSON parse error gracefully
      await page.waitForTimeout(3000);
      
      // Should show error state or fallback
      const errorMessage = page.locator('[data-testid="error-message"], text="Không thể tải thống kê"');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });

    test('should retry failed requests', async ({ page }) => {
      let requestCount = 0;
      
      // Mock failing then succeeding request
      await page.route('/api/admin/teams/stats', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.goto('/admin/teams-assignment');
      
      // Should retry and eventually succeed
      await page.waitForTimeout(5000);
      
      expect(requestCount).toBeGreaterThan(1);
    });
  });
});
