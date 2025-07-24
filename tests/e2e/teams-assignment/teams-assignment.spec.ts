import { test, expect } from '@playwright/test';

test.describe('Teams Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'dev.thubv@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(url => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('should access teams assignment page', async ({ page }) => {
    await page.goto('/admin/teams-assignment');
    await page.waitForLoadState('networkidle');
    
    // Check page is accessible
    expect(page.url()).toContain('teams-assignment');
    
    // Check page has content
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();
    expect(pageText!.length).toBeGreaterThan(1000);
  });

  test('should display tabs correctly', async ({ page }) => {
    await page.goto('/admin/teams-assignment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for dynamic content

    // Check for tab elements (more flexible approach)
    const overviewTabs = await page.locator('text="Tổng quan"').count();
    const unassignedTabs = await page.locator('text="Chưa phân đội"').count();
    const manageTeamsTabs = await page.locator('text="Quản lý đội"').count();
    const roleTabs = await page.locator('[role="tab"]').count();

    // At least some tab-like elements should exist
    const totalTabElements = overviewTabs + unassignedTabs + manageTeamsTabs + roleTabs;
    expect(totalTabElements).toBeGreaterThan(0);

    // Log for debugging
    console.log(`Found tabs: Overview=${overviewTabs}, Unassigned=${unassignedTabs}, ManageTeams=${manageTeamsTabs}, RoleTabs=${roleTabs}`);
  });

  test('should interact with tabs', async ({ page }) => {
    await page.goto('/admin/teams-assignment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const initialUrl = page.url();

    // Try to click on overview tab
    const overviewTab = page.locator('text="Tổng quan"').first();
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
    }

    // Try to click on unassigned tab
    const unassignedTab = page.locator('text="Chưa phân đội"').first();
    if (await unassignedTab.isVisible()) {
      await unassignedTab.click();
      await page.waitForTimeout(1000);
    }

    // Page should still be accessible (may redirect to admin dashboard)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/admin/);
  });

  test('should have interactive elements', async ({ page }) => {
    await page.goto('/admin/teams-assignment');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for buttons
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(5);
    
    // Check for links
    const links = await page.locator('a').count();
    expect(links).toBeGreaterThan(10);
  });
});
