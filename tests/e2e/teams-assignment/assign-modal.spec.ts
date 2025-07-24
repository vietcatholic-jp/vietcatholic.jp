import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';

test.describe('Teams Assignment - Assign Team Modal', () => {
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

  test.describe('Modal Opening and Display', () => {
    test('should open assign team modal when clicking assign button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      const buttonCount = await assignButtons.count();
      
      if (buttonCount > 0) {
        // Get registrant name from the row
        const firstRow = page.locator('[data-testid="registrant-row"]').first();
        const rowText = await firstRow.textContent() || '';
        const nameMatch = rowText.match(/([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+)/);
        
        // Click assign button
        await assignButtons.first().click();
        
        // Verify modal opens
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Verify modal title contains registrant name
        if (nameMatch) {
          const modalTitle = modal.locator('h2, .modal-title');
          await expect(modalTitle).toContainText(nameMatch[1].trim());
        }
      }
    });

    test('should display registrant information in modal', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        // Get registrant info from row
        const firstRow = page.locator('[data-testid="registrant-row"]').first();
        const rowText = await firstRow.textContent() || '';
        
        // Click assign button
        await assignButtons.first().click();
        
        // Verify modal displays registrant info
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Check for registrant details
        const registrantInfo = modal.locator('[data-testid="registrant-info"]');
        if (await registrantInfo.isVisible()) {
          const infoText = await registrantInfo.textContent() || '';
          
          // Should contain registration code
          expect(infoText).toMatch(/DH\d+/);
          
          // Should contain gender
          expect(infoText).toMatch(/Nam|Nữ|Male|Female/);
          
          // Should contain age
          expect(infoText).toMatch(/\d{2}/);
        }
      }
    });

    test('should display team selection dropdown', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Verify team select dropdown
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await expect(teamSelect).toBeVisible();
        
        // Click to open dropdown
        await teamSelect.click();
        
        // Verify team options are available
        const teamOptions = page.locator('[role="option"]');
        const optionCount = await teamOptions.count();
        expect(optionCount).toBeGreaterThan(0);
        
        // Verify team option format (should show team name and member count)
        if (optionCount > 0) {
          const firstOptionText = await teamOptions.first().textContent() || '';
          expect(firstOptionText).toMatch(/\d+.*người/); // Should contain member count
        }
      }
    });

    test('should display notes input field', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Verify notes input
        const notesInput = modal.locator('[data-testid="notes-input"]');
        await expect(notesInput).toBeVisible();
        
        // Verify it's optional (placeholder should indicate this)
        const placeholder = await notesInput.getAttribute('placeholder');
        expect(placeholder).toMatch(/tùy chọn|optional/i);
      }
    });
  });

  test.describe('Team Selection', () => {
    test('should enable confirm button when team is selected', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Confirm button should be disabled initially
        const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
        await expect(confirmButton).toBeDisabled();
        
        // Select a team
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          await teamOptions.first().click();
          
          // Confirm button should now be enabled
          await expect(confirmButton).toBeEnabled();
        }
      }
    });

    test('should display team information when selected', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Select a team
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          const firstOption = teamOptions.first();
          const optionText = await firstOption.textContent() || '';
          await firstOption.click();
          
          // Verify team info is displayed
          const teamInfo = modal.locator('[data-testid="team-info"]');
          if (await teamInfo.isVisible()) {
            const infoText = await teamInfo.textContent() || '';
            
            // Should contain team name
            expect(infoText).toContain('Đội');
            
            // Should contain member count
            expect(infoText).toMatch(/\d+.*thành viên/);
          }
        }
      }
    });

    test('should handle team capacity limits', async ({ page }) => {
      // Mock team with capacity limit
      await page.route('/api/admin/teams', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'team-1',
              name: 'Đội Full',
              description: 'Team at capacity',
              capacity: 5,
              current_members: 5
            },
            {
              id: 'team-2',
              name: 'Đội Available',
              description: 'Team with space',
              capacity: 10,
              current_members: 3
            }
          ])
        });
      });
      
      await page.reload();
      await teamsPage.clickUnassignedTab();
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        // Full team should be disabled or marked as full
        const fullTeamOption = page.locator('[role="option"]:has-text("Đội Full")');
        if (await fullTeamOption.count() > 0) {
          const isDisabled = await fullTeamOption.getAttribute('aria-disabled');
          const optionText = await fullTeamOption.textContent() || '';
          
          // Should indicate it's full
          expect(isDisabled === 'true' || optionText.includes('Full') || optionText.includes('5/5')).toBeTruthy();
        }
        
        // Available team should be selectable
        const availableTeamOption = page.locator('[role="option"]:has-text("Đội Available")');
        if (await availableTeamOption.count() > 0) {
          await availableTeamOption.click();
          
          const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
          await expect(confirmButton).toBeEnabled();
        }
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should require team selection before allowing assignment', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Try to confirm without selecting team
        const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
        await expect(confirmButton).toBeDisabled();
        
        // Add notes without selecting team
        const notesInput = modal.locator('[data-testid="notes-input"]');
        await notesInput.fill('Test notes');
        
        // Confirm button should still be disabled
        await expect(confirmButton).toBeDisabled();
      }
    });

    test('should validate notes input length', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Fill very long notes
        const notesInput = modal.locator('[data-testid="notes-input"]');
        const longNotes = 'A'.repeat(1000);
        await notesInput.fill(longNotes);
        
        // Check if there's a character limit or validation message
        const validationMessage = modal.locator('[data-testid="notes-validation"], .error-message');
        if (await validationMessage.isVisible()) {
          const messageText = await validationMessage.textContent();
          expect(messageText).toMatch(/quá dài|too long|limit/i);
        }
      }
    });
  });

  test.describe('Assignment Process', () => {
    test('should successfully assign registrant to team', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        // Get initial unassigned count
        const initialCountText = await page.locator('[data-testid="unassigned-count"]').textContent() || '';
        const initialCountMatch = initialCountText.match(/(\d+)/);
        const initialCount = initialCountMatch ? parseInt(initialCountMatch[1]) : 0;
        
        // Get registrant name
        const firstRow = page.locator('[data-testid="registrant-row"]').first();
        const rowText = await firstRow.textContent() || '';
        const nameMatch = rowText.match(/([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+)/);
        
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Select team
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          await teamOptions.first().click();
          
          // Add notes
          const notesInput = modal.locator('[data-testid="notes-input"]');
          await notesInput.fill('Test assignment notes');
          
          // Confirm assignment
          const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
          await confirmButton.click();
          
          // Wait for assignment to complete
          await page.waitForLoadState('networkidle');
          
          // Modal should close
          await expect(modal).not.toBeVisible();
          
          // Should show success message
          const successMessage = page.locator('[data-testid="toast"], .toast, text="thành công"');
          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
          
          // Unassigned count should decrease
          const newCountText = await page.locator('[data-testid="unassigned-count"]').textContent() || '';
          const newCountMatch = newCountText.match(/(\d+)/);
          const newCount = newCountMatch ? parseInt(newCountMatch[1]) : 0;
          
          if (initialCount > 0) {
            expect(newCount).toBeLessThan(initialCount);
          }
        }
      }
    });

    test('should handle assignment errors gracefully', async ({ page }) => {
      // Mock assignment error
      await page.route('/api/admin/registrants/*/assign-team', (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Team not found' })
        });
      });
      
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Select team
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          await teamOptions.first().click();
          
          // Confirm assignment
          const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
          await confirmButton.click();
          
          // Should show error message
          const errorMessage = page.locator('[data-testid="toast"], .toast, text="lỗi", text="error"');
          await expect(errorMessage).toBeVisible();
          
          // Modal should remain open for retry
          await expect(modal).toBeVisible();
        }
      }
    });

    test('should disable form during submission', async ({ page }) => {
      // Mock slow assignment response
      await page.route('/api/admin/registrants/*/assign-team', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });
      
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Select team
        const teamSelect = modal.locator('[data-testid="team-select"]');
        await teamSelect.click();
        
        const teamOptions = page.locator('[role="option"]');
        if (await teamOptions.count() > 0) {
          await teamOptions.first().click();
          
          // Click confirm
          const confirmButton = modal.locator('[data-testid="confirm-assign-btn"]');
          await confirmButton.click();
          
          // Button should be disabled during submission
          await expect(confirmButton).toBeDisabled();
          
          // Form fields should be disabled
          await expect(teamSelect).toBeDisabled();
          
          const notesInput = modal.locator('[data-testid="notes-input"]');
          await expect(notesInput).toBeDisabled();
        }
      }
    });
  });

  test.describe('Modal Closing', () => {
    test('should close modal when clicking cancel', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Click cancel
        const cancelButton = modal.locator('[data-testid="cancel-btn"]');
        await cancelButton.click();
        
        // Modal should close
        await expect(modal).not.toBeVisible();
      }
    });

    test('should close modal when clicking X button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Click X button
        const closeButton = modal.locator('[data-testid="close-btn"], button:has-text("×")');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          
          // Modal should close
          await expect(modal).not.toBeVisible();
        }
      }
    });

    test('should close modal when clicking outside', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Click outside modal (on backdrop)
        const backdrop = page.locator('[data-testid="modal-backdrop"], .modal-backdrop');
        if (await backdrop.isVisible()) {
          await backdrop.click();
          
          // Modal should close
          await expect(modal).not.toBeVisible();
        }
      }
    });

    test('should handle escape key to close modal', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const assignButtons = page.locator('[data-testid="assign-team-btn"]');
      if (await assignButtons.count() > 0) {
        await assignButtons.first().click();
        
        const modal = page.locator('[data-testid="assign-team-modal"]');
        await expect(modal).toBeVisible();
        
        // Press escape key
        await page.keyboard.press('Escape');
        
        // Modal should close
        await expect(modal).not.toBeVisible();
      }
    });
  });
});
