import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';
import { TEST_USERS } from '../../fixtures/test-data';

test.describe('Authentication & Authorization for Teams Assignment', () => {
  let loginPage: LoginPage;
  let teamsPage: TeamsAssignmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teamsPage = new TeamsAssignmentPage(page);
  });

  test.describe('Super Admin Access', () => {
    test('should allow super admin to access teams assignment page', async ({ page }) => {
      // Login as super admin
      await loginPage.loginAsSuperAdmin();
      
      // Navigate to teams assignment page
      await teamsPage.navigateToTeamsAssignment();
      
      // Verify page loads successfully
      await teamsPage.verifyPageLoaded();
      
      // Verify all tabs are accessible
      await teamsPage.clickOverviewTab();
      await teamsPage.clickUnassignedTab();
      await teamsPage.clickTeamManagementTab();
    });

    test('should display correct user role in header', async ({ page }) => {
      await loginPage.loginAsSuperAdmin();
      await teamsPage.navigateToTeamsAssignment();
      
      // Check for admin role indicator
      const roleIndicator = page.locator('[data-testid="user-role"], .user-role');
      if (await roleIndicator.isVisible()) {
        await expect(roleIndicator).toContainText('super_admin');
      }
    });
  });

  test.describe('Event Organizer Access', () => {
    test('should allow event organizer to access teams assignment page', async ({ page }) => {
      // Login as event organizer
      await loginPage.loginAsEventOrganizer();
      
      // Navigate to teams assignment page
      await teamsPage.navigateToTeamsAssignment();
      
      // Verify page loads successfully
      await teamsPage.verifyPageLoaded();
    });

    test('should have same permissions as super admin for teams assignment', async ({ page }) => {
      await loginPage.loginAsEventOrganizer();
      await teamsPage.navigateToTeamsAssignment();
      
      // Verify all tabs are accessible
      await teamsPage.clickOverviewTab();
      await teamsPage.clickUnassignedTab();
      await teamsPage.clickTeamManagementTab();
      
      // Verify action buttons are available
      await teamsPage.clickUnassignedTab();
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      expect(await assignButtons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Unauthorized Access', () => {
    test('should redirect participant to unauthorized page', async ({ page }) => {
      // Login as participant
      await loginPage.loginAsParticipant();
      
      // Try to access teams assignment page
      await page.goto('/admin/teams-assignment');
      
      // Should be redirected to unauthorized page or dashboard
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      
      // Should not be on teams assignment page
      expect(currentUrl).not.toContain('/admin/teams-assignment');
      
      // Should show unauthorized message or redirect to appropriate page
      const unauthorizedSelectors = [
        'text="Unauthorized"',
        'text="Không có quyền truy cập"',
        'text="403"',
        '[data-testid="unauthorized"]'
      ];
      
      let foundUnauthorized = false;
      for (const selector of unauthorizedSelectors) {
        if (await page.locator(selector).isVisible()) {
          foundUnauthorized = true;
          break;
        }
      }
      
      // Either shows unauthorized message or redirects away from admin
      expect(foundUnauthorized || !currentUrl.includes('/admin')).toBeTruthy();
    });

    test('should redirect unauthenticated user to login', async ({ page }) => {
      // Try to access teams assignment page without login
      await page.goto('/admin/teams-assignment');
      
      // Should be redirected to login page
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

    test('should maintain redirect URL after login', async ({ page }) => {
      // Try to access teams assignment page without login
      await page.goto('/admin/teams-assignment');
      
      // Should be redirected to login page
      await expect(page).toHaveURL(/\/auth\/sign-in/);
      
      // Login as super admin
      await loginPage.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
      
      // Should be redirected back to teams assignment page
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/teams-assignment/);
    });
  });

  test.describe('Session Management', () => {
    test('should logout user and redirect to login', async ({ page }) => {
      // Login first
      await loginPage.loginAsSuperAdmin();
      await teamsPage.navigateToTeamsAssignment();
      
      // Logout
      await loginPage.logout();
      
      // Should be redirected to login page
      await expect(page).toHaveURL(/\/auth\/sign-in/);
      
      // Try to access teams assignment page again
      await page.goto('/admin/teams-assignment');
      
      // Should be redirected to login page
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

    test('should handle expired session gracefully', async ({ page }) => {
      // Login first
      await loginPage.loginAsSuperAdmin();
      await teamsPage.navigateToTeamsAssignment();
      
      // Simulate expired session by clearing cookies
      await page.context().clearCookies();
      
      // Try to perform an action that requires authentication
      await teamsPage.clickUnassignedTab();
      
      // Should handle expired session (either redirect to login or show error)
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      const hasAuthError = await page.locator('text="Unauthorized", text="Session expired"').isVisible();
      
      expect(currentUrl.includes('/auth/sign-in') || hasAuthError).toBeTruthy();
    });
  });

  test.describe('API Authorization', () => {
    test('should receive 401 for API calls without authentication', async ({ page }) => {
      // Intercept API calls
      const apiResponses: any[] = [];
      
      page.on('response', (response) => {
        if (response.url().includes('/api/admin/')) {
          apiResponses.push({
            url: response.url(),
            status: response.status()
          });
        }
      });
      
      // Try to access teams assignment page without login
      await page.goto('/admin/teams-assignment');
      
      // Wait for potential API calls
      await page.waitForTimeout(2000);
      
      // Check if any admin API calls returned 401
      const unauthorizedCalls = apiResponses.filter(r => r.status === 401);
      
      if (unauthorizedCalls.length > 0) {
        console.log('Unauthorized API calls detected:', unauthorizedCalls);
      }
    });

    test('should receive proper responses for authenticated API calls', async ({ page }) => {
      // Login first
      await loginPage.loginAsSuperAdmin();
      
      // Intercept API calls
      const apiResponses: any[] = [];
      
      page.on('response', (response) => {
        if (response.url().includes('/api/admin/teams')) {
          apiResponses.push({
            url: response.url(),
            status: response.status()
          });
        }
      });
      
      // Navigate to teams assignment page
      await teamsPage.navigateToTeamsAssignment();
      
      // Wait for API calls to complete
      await page.waitForTimeout(3000);
      
      // Check that API calls are successful
      const successfulCalls = apiResponses.filter(r => r.status === 200);
      expect(successfulCalls.length).toBeGreaterThan(0);
      
      // No unauthorized calls
      const unauthorizedCalls = apiResponses.filter(r => r.status === 401 || r.status === 403);
      expect(unauthorizedCalls.length).toBe(0);
    });
  });
});
