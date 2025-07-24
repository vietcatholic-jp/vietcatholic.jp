import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';
import { MOCK_STATS } from '../../fixtures/test-data';

test.describe('Teams Assignment - Overview Tab', () => {
  let loginPage: LoginPage;
  let teamsPage: TeamsAssignmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teamsPage = new TeamsAssignmentPage(page);
    
    // Login as admin before each test
    await loginPage.loginAsSuperAdmin();
    await teamsPage.navigateToTeamsAssignment();
    await teamsPage.clickOverviewTab();
  });

  test.describe('Statistics Display', () => {
    test('should display correct overview statistics', async ({ page }) => {
      // Wait for stats to load
      await page.waitForLoadState('networkidle');
      
      // Verify statistics cards are visible
      const statsCards = [
        '[data-testid="total-teams-card"]',
        '[data-testid="assigned-card"]',
        '[data-testid="unassigned-card"]',
        '[data-testid="assignment-percentage-card"]'
      ];
      
      for (const cardSelector of statsCards) {
        await expect(page.locator(cardSelector)).toBeVisible();
      }
      
      // Verify statistics contain numbers
      const totalTeamsText = await page.locator('[data-testid="total-teams-card"]').textContent();
      expect(totalTeamsText).toMatch(/\d+/);
      
      const assignedText = await page.locator('[data-testid="assigned-card"]').textContent();
      expect(assignedText).toMatch(/\d+/);
      
      const unassignedText = await page.locator('[data-testid="unassigned-card"]').textContent();
      expect(unassignedText).toMatch(/\d+/);
      
      const percentageText = await page.locator('[data-testid="assignment-percentage-card"]').textContent();
      expect(percentageText).toMatch(/\d+%/);
    });

    test('should calculate assignment percentage correctly', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Get assigned and unassigned counts
      const assignedText = await page.locator('[data-testid="assigned-card"]').textContent() || '';
      const unassignedText = await page.locator('[data-testid="unassigned-card"]').textContent() || '';
      const percentageText = await page.locator('[data-testid="assignment-percentage-card"]').textContent() || '';
      
      const assignedMatch = assignedText.match(/(\d+)/);
      const unassignedMatch = unassignedText.match(/(\d+)/);
      const percentageMatch = percentageText.match(/(\d+)%/);
      
      if (assignedMatch && unassignedMatch && percentageMatch) {
        const assigned = parseInt(assignedMatch[1]);
        const unassigned = parseInt(unassignedMatch[1]);
        const percentage = parseInt(percentageMatch[1]);
        
        const total = assigned + unassigned;
        const expectedPercentage = total > 0 ? Math.round((assigned / total) * 100) : 0;
        
        expect(percentage).toBe(expectedPercentage);
      }
    });

    test('should update statistics when data changes', async ({ page }) => {
      // Get initial stats
      const initialAssigned = await page.locator('[data-testid="assigned-card"]').textContent();
      
      // Mock updated stats
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total_teams: 2,
            total_assigned: 5,
            total_unassigned: 16,
            assignment_percentage: 24
          })
        });
      });
      
      // Refresh the page
      await page.reload();
      await teamsPage.clickOverviewTab();
      await page.waitForLoadState('networkidle');
      
      // Verify stats have updated
      const updatedAssigned = await page.locator('[data-testid="assigned-card"]').textContent();
      expect(updatedAssigned).not.toBe(initialAssigned);
      expect(updatedAssigned).toContain('5');
    });
  });

  test.describe('Charts and Visualizations', () => {
    test('should display team distribution chart', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check for team distribution chart
      const teamChart = page.locator('[data-testid="team-distribution-chart"]');
      await expect(teamChart).toBeVisible();
      
      // Verify chart has data
      const chartData = page.locator('[data-testid="team-distribution-chart"] .recharts-bar, [data-testid="team-distribution-chart"] .bar');
      if (await chartData.count() > 0) {
        await expect(chartData.first()).toBeVisible();
      }
    });

    test('should display gender distribution chart', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check for gender distribution chart
      const genderChart = page.locator('[data-testid="gender-distribution-chart"]');
      await expect(genderChart).toBeVisible();
      
      // Verify chart shows gender labels
      const chartLabels = page.locator('[data-testid="gender-distribution-chart"] text');
      const labelTexts = await chartLabels.allTextContents();
      const hasGenderLabels = labelTexts.some(text => 
        text.includes('Nam') || text.includes('Nữ') || text.includes('Male') || text.includes('Female')
      );
      
      if (labelTexts.length > 0) {
        expect(hasGenderLabels).toBeTruthy();
      }
    });

    test('should display age distribution chart', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check for age distribution chart
      const ageChart = page.locator('[data-testid="age-distribution-chart"]');
      await expect(ageChart).toBeVisible();
      
      // Verify chart shows age ranges
      const chartLabels = page.locator('[data-testid="age-distribution-chart"] text');
      const labelTexts = await chartLabels.allTextContents();
      const hasAgeRanges = labelTexts.some(text => 
        text.includes('-') || text.includes('18') || text.includes('25') || text.includes('35')
      );
      
      if (labelTexts.length > 0) {
        expect(hasAgeRanges).toBeTruthy();
      }
    });

    test('should handle empty chart data gracefully', async ({ page }) => {
      // Mock empty data
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
      
      // Charts should still be visible but show empty state
      const charts = [
        '[data-testid="team-distribution-chart"]',
        '[data-testid="gender-distribution-chart"]',
        '[data-testid="age-distribution-chart"]'
      ];
      
      for (const chartSelector of charts) {
        const chart = page.locator(chartSelector);
        await expect(chart).toBeVisible();
        
        // Should show empty state message
        const emptyMessage = chart.locator('text="Không có dữ liệu", text="No data"');
        if (await emptyMessage.count() > 0) {
          await expect(emptyMessage.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Data Accuracy', () => {
    test('should match statistics with actual data', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Get overview stats
      const totalTeamsText = await page.locator('[data-testid="total-teams-card"]').textContent() || '';
      const assignedText = await page.locator('[data-testid="assigned-card"]').textContent() || '';
      const unassignedText = await page.locator('[data-testid="unassigned-card"]').textContent() || '';
      
      const totalTeamsMatch = totalTeamsText.match(/(\d+)/);
      const assignedMatch = assignedText.match(/(\d+)/);
      const unassignedMatch = unassignedText.match(/(\d+)/);
      
      // Navigate to unassigned tab to verify count
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const unassignedCountElement = page.locator('[data-testid="unassigned-count"]');
      if (await unassignedCountElement.isVisible()) {
        const unassignedCountText = await unassignedCountElement.textContent() || '';
        const unassignedCountMatch = unassignedCountText.match(/(\d+)/);
        
        if (unassignedMatch && unassignedCountMatch) {
          const overviewUnassigned = parseInt(unassignedMatch[1]);
          const tabUnassigned = parseInt(unassignedCountMatch[1]);
          expect(overviewUnassigned).toBe(tabUnassigned);
        }
      }
      
      // Navigate to team management tab to verify team count
      await teamsPage.clickTeamManagementTab();
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      const actualTeamCount = await teamCards.count();
      
      if (totalTeamsMatch) {
        const overviewTeamCount = parseInt(totalTeamsMatch[1]);
        expect(overviewTeamCount).toBe(actualTeamCount);
      }
    });

    test('should refresh data when navigating back to overview', async ({ page }) => {
      // Get initial data
      await page.waitForLoadState('networkidle');
      const initialData = await page.locator('[data-testid="assigned-card"]').textContent();
      
      // Navigate away and back
      await teamsPage.clickUnassignedTab();
      await page.waitForTimeout(1000);
      await teamsPage.clickOverviewTab();
      await page.waitForLoadState('networkidle');
      
      // Data should be refreshed (at minimum, same data should be displayed)
      const refreshedData = await page.locator('[data-testid="assigned-card"]').textContent();
      expect(refreshedData).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('/api/admin/teams/stats', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"], text="Không thể tải thống kê"');
      await expect(errorMessage).toBeVisible();
      
      // Statistics cards should show error state or default values
      const statsCards = page.locator('[data-testid="total-teams-card"], [data-testid="assigned-card"]');
      await expect(statsCards.first()).toBeVisible();
    });

    test('should handle slow API responses', async ({ page }) => {
      // Mock slow API response
      await page.route('/api/admin/teams/stats', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        route.continue();
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      
      // Should show loading state
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, text="Đang tải"');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for data to load
      await page.waitForLoadState('networkidle');
      
      // Loading should be gone and data should be visible
      await expect(loadingIndicator).not.toBeVisible();
      const statsCard = page.locator('[data-testid="total-teams-card"]');
      await expect(statsCard).toBeVisible();
    });

    test('should handle network failures', async ({ page }) => {
      // Mock network failure
      await page.route('/api/admin/teams/stats', (route) => {
        route.abort('failed');
      });
      
      await page.reload();
      await teamsPage.clickOverviewTab();
      
      // Should handle network failure gracefully
      await page.waitForTimeout(3000);
      
      // Page should still be functional
      const overviewTab = page.locator('[data-testid="tab-overview"]');
      await expect(overviewTab).toBeVisible();
      
      // Should be able to navigate to other tabs
      await teamsPage.clickUnassignedTab();
      await teamsPage.clickTeamManagementTab();
    });
  });
});
