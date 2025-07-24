import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';
import { TEST_REGISTRANTS } from '../../fixtures/test-data';

test.describe('Teams Assignment - Unassigned Tab', () => {
  let loginPage: LoginPage;
  let teamsPage: TeamsAssignmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teamsPage = new TeamsAssignmentPage(page);
    
    // Login as admin before each test
    await loginPage.loginAsSuperAdmin();
    await teamsPage.navigateToTeamsAssignment();
    await teamsPage.clickUnassignedTab();
  });

  test.describe('Registrants List Display', () => {
    test('should display unassigned registrants list', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Verify unassigned count is displayed
      const countElement = page.locator('[data-testid="unassigned-count"]');
      await expect(countElement).toBeVisible();
      
      const countText = await countElement.textContent();
      expect(countText).toMatch(/\d+/);
      
      // Verify registrant rows are displayed
      const registrantRows = page.locator('[data-testid="registrant-row"]');
      const rowCount = await registrantRows.count();
      
      if (rowCount > 0) {
        // Verify first row has required information
        const firstRow = registrantRows.first();
        await expect(firstRow).toBeVisible();
        
        // Check for required columns
        const requiredColumns = [
          'text=/[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+/', // Full name
          'text=/DH\d+/', // Registration code
          'text=/Nam|Nữ|Male|Female/', // Gender
          'text=/\d+/', // Age
        ];
        
        for (const columnSelector of requiredColumns) {
          const column = firstRow.locator(columnSelector);
          if (await column.count() > 0) {
            await expect(column.first()).toBeVisible();
          }
        }
        
        // Verify assign button is present
        const assignButton = firstRow.locator('[data-testid="assign-team-btn"]');
        await expect(assignButton).toBeVisible();
      }
    });

    test('should display correct registrant information', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const registrantRows = page.locator('[data-testid="registrant-row"]');
      const rowCount = await registrantRows.count();
      
      if (rowCount > 0) {
        const firstRow = registrantRows.first();
        
        // Get all text content from the row
        const rowText = await firstRow.textContent() || '';
        
        // Should contain typical Vietnamese name pattern
        expect(rowText).toMatch(/[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/);
        
        // Should contain registration code pattern
        expect(rowText).toMatch(/DH\d+/);
        
        // Should contain age (number)
        expect(rowText).toMatch(/\d{2}/);
      }
    });

    test('should handle empty state when no unassigned registrants', async ({ page }) => {
      // Mock empty response
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
      
      // Should show empty state message
      const emptyMessage = page.locator('text="Không có người tham dự nào chưa được phân đội"');
      await expect(emptyMessage).toBeVisible();
      
      // Count should show 0
      const countElement = page.locator('[data-testid="unassigned-count"]');
      if (await countElement.isVisible()) {
        const countText = await countElement.textContent();
        expect(countText).toContain('0');
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should search registrants by name', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Get initial count
      const initialRows = await page.locator('[data-testid="registrant-row"]').count();
      
      if (initialRows > 0) {
        // Get first registrant name
        const firstRow = page.locator('[data-testid="registrant-row"]').first();
        const firstRowText = await firstRow.textContent() || '';
        const nameMatch = firstRowText.match(/([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+)/);
        
        if (nameMatch) {
          const firstName = nameMatch[1].split(' ')[0];
          
          // Search for first name
          await teamsPage.searchRegistrants(firstName);
          await page.waitForLoadState('networkidle');
          
          // Results should be filtered
          const filteredRows = await page.locator('[data-testid="registrant-row"]').count();
          
          // Should have results containing the search term
          if (filteredRows > 0) {
            const resultRows = page.locator('[data-testid="registrant-row"]');
            const firstResultText = await resultRows.first().textContent() || '';
            expect(firstResultText.toUpperCase()).toContain(firstName.toUpperCase());
          }
        }
      }
    });

    test('should search registrants by registration code', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const registrantRows = page.locator('[data-testid="registrant-row"]');
      const rowCount = await registrantRows.count();
      
      if (rowCount > 0) {
        // Get first registration code
        const firstRowText = await registrantRows.first().textContent() || '';
        const codeMatch = firstRowText.match(/(DH\d+)/);
        
        if (codeMatch) {
          const regCode = codeMatch[1];
          
          // Search for registration code
          await teamsPage.searchRegistrants(regCode);
          await page.waitForLoadState('networkidle');
          
          // Should find the specific registrant
          const resultRows = page.locator('[data-testid="registrant-row"]');
          const resultCount = await resultRows.count();
          
          if (resultCount > 0) {
            const resultText = await resultRows.first().textContent() || '';
            expect(resultText).toContain(regCode);
          }
        }
      }
    });

    test('should handle search with no results', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Search for non-existent term
      await teamsPage.searchRegistrants('NONEXISTENTNAME12345');
      await page.waitForLoadState('networkidle');
      
      // Should show no results message
      const noResultsMessage = page.locator('text="Không tìm thấy kết quả", text="No results found"');
      await expect(noResultsMessage).toBeVisible();
      
      // Or should show empty list
      const registrantRows = page.locator('[data-testid="registrant-row"]');
      expect(await registrantRows.count()).toBe(0);
    });

    test('should clear search results', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Get initial count
      const initialCount = await page.locator('[data-testid="registrant-row"]').count();
      
      if (initialCount > 0) {
        // Perform search
        await teamsPage.searchRegistrants('TEST');
        await page.waitForLoadState('networkidle');
        
        // Clear search
        const searchInput = page.locator('[data-testid="search-input"]');
        await searchInput.clear();
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');
        
        // Should show all results again
        const clearedCount = await page.locator('[data-testid="registrant-row"]').count();
        expect(clearedCount).toBe(initialCount);
      }
    });
  });

  test.describe('Filter Functionality', () => {
    test('should filter by gender', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check if gender filter exists
      const genderFilter = page.locator('[data-testid="gender-filter"]');
      if (await genderFilter.isVisible()) {
        // Select male filter
        await genderFilter.selectOption('male');
        await page.waitForLoadState('networkidle');
        
        // Verify filtered results
        const filteredRows = page.locator('[data-testid="registrant-row"]');
        const rowCount = await filteredRows.count();
        
        if (rowCount > 0) {
          // Check that all visible rows are male
          for (let i = 0; i < Math.min(rowCount, 5); i++) {
            const rowText = await filteredRows.nth(i).textContent() || '';
            expect(rowText).toMatch(/Nam|Male/);
          }
        }
      }
    });

    test('should filter by age range', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check if age filter exists
      const ageFilter = page.locator('[data-testid="age-filter"]');
      if (await ageFilter.isVisible()) {
        // Select age range
        await ageFilter.selectOption('18-25');
        await page.waitForLoadState('networkidle');
        
        // Verify filtered results
        const filteredRows = page.locator('[data-testid="registrant-row"]');
        const rowCount = await filteredRows.count();
        
        if (rowCount > 0) {
          // Check that ages are in range
          for (let i = 0; i < Math.min(rowCount, 3); i++) {
            const rowText = await filteredRows.nth(i).textContent() || '';
            const ageMatch = rowText.match(/(\d{2})/);
            if (ageMatch) {
              const age = parseInt(ageMatch[1]);
              expect(age).toBeGreaterThanOrEqual(18);
              expect(age).toBeLessThanOrEqual(25);
            }
          }
        }
      }
    });

    test('should filter by province', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check if province filter exists
      const provinceFilter = page.locator('[data-testid="province-filter"]');
      if (await provinceFilter.isVisible()) {
        // Get available options
        const options = provinceFilter.locator('option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
          // Select second option (first is usually "All")
          const secondOption = options.nth(1);
          const optionValue = await secondOption.getAttribute('value');
          const optionText = await secondOption.textContent();
          
          if (optionValue && optionText) {
            await provinceFilter.selectOption(optionValue);
            await page.waitForLoadState('networkidle');
            
            // Verify filtered results
            const filteredRows = page.locator('[data-testid="registrant-row"]');
            const rowCount = await filteredRows.count();
            
            if (rowCount > 0) {
              // Check that province matches
              const firstRowText = await filteredRows.first().textContent() || '';
              expect(firstRowText).toContain(optionText);
            }
          }
        }
      }
    });

    test('should combine multiple filters', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Apply gender filter
      const genderFilter = page.locator('[data-testid="gender-filter"]');
      if (await genderFilter.isVisible()) {
        await genderFilter.selectOption('male');
        await page.waitForTimeout(1000);
      }
      
      // Apply age filter
      const ageFilter = page.locator('[data-testid="age-filter"]');
      if (await ageFilter.isVisible()) {
        await ageFilter.selectOption('18-25');
        await page.waitForTimeout(1000);
      }
      
      await page.waitForLoadState('networkidle');
      
      // Verify combined filters work
      const filteredRows = page.locator('[data-testid="registrant-row"]');
      const rowCount = await filteredRows.count();
      
      if (rowCount > 0) {
        const firstRowText = await filteredRows.first().textContent() || '';
        expect(firstRowText).toMatch(/Nam|Male/);
        
        const ageMatch = firstRowText.match(/(\d{2})/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          expect(age).toBeGreaterThanOrEqual(18);
          expect(age).toBeLessThanOrEqual(25);
        }
      }
    });
  });

  test.describe('Selection Functionality', () => {
    test('should select individual registrants', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const registrantRows = page.locator('[data-testid="registrant-row"]');
      const rowCount = await registrantRows.count();
      
      if (rowCount > 0) {
        // Select first registrant
        const firstCheckbox = registrantRows.first().locator('input[type="checkbox"]');
        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.check();
          
          // Verify checkbox is checked
          await expect(firstCheckbox).toBeChecked();
          
          // Verify selection count updates
          const selectionCount = page.locator('[data-testid="selection-count"]');
          if (await selectionCount.isVisible()) {
            const countText = await selectionCount.textContent();
            expect(countText).toContain('1');
          }
        }
      }
    });

    test('should select all registrants', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check();
        
        // Verify all checkboxes are checked
        const individualCheckboxes = page.locator('[data-testid="registrant-row"] input[type="checkbox"]');
        const checkboxCount = await individualCheckboxes.count();
        
        for (let i = 0; i < checkboxCount; i++) {
          await expect(individualCheckboxes.nth(i)).toBeChecked();
        }
        
        // Verify selection count shows all
        const selectionCount = page.locator('[data-testid="selection-count"]');
        if (await selectionCount.isVisible()) {
          const countText = await selectionCount.textContent();
          expect(countText).toContain(checkboxCount.toString());
        }
      }
    });

    test('should deselect all registrants', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // First select all
      const selectAllCheckbox = page.locator('[data-testid="select-all-checkbox"]');
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check();
        await page.waitForTimeout(500);
        
        // Then deselect all
        await selectAllCheckbox.uncheck();
        
        // Verify all checkboxes are unchecked
        const individualCheckboxes = page.locator('[data-testid="registrant-row"] input[type="checkbox"]');
        const checkboxCount = await individualCheckboxes.count();
        
        for (let i = 0; i < checkboxCount; i++) {
          await expect(individualCheckboxes.nth(i)).not.toBeChecked();
        }
        
        // Verify selection count shows 0
        const selectionCount = page.locator('[data-testid="selection-count"]');
        if (await selectionCount.isVisible()) {
          const countText = await selectionCount.textContent();
          expect(countText).toContain('0');
        }
      }
    });
  });

  test.describe('Pagination', () => {
    test('should handle pagination when more than 50 registrants', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Check if pagination exists
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        // Check for next page button
        const nextButton = pagination.locator('button:has-text("Next"), button:has-text("Tiếp")');
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          // Get current page registrants
          const currentPageRows = await page.locator('[data-testid="registrant-row"]').count();
          
          // Go to next page
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          
          // Verify page changed
          const nextPageRows = await page.locator('[data-testid="registrant-row"]').count();
          expect(nextPageRows).toBeGreaterThan(0);
          
          // Go back to first page
          const prevButton = pagination.locator('button:has-text("Previous"), button:has-text("Trước")');
          if (await prevButton.isVisible()) {
            await prevButton.click();
            await page.waitForLoadState('networkidle');
            
            // Should be back to original count
            const backToFirstRows = await page.locator('[data-testid="registrant-row"]').count();
            expect(backToFirstRows).toBe(currentPageRows);
          }
        }
      }
    });
  });
});
