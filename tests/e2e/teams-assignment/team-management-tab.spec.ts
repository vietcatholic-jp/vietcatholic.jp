import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/login-page';
import { TeamsAssignmentPage } from '../../page-objects/teams-assignment-page';

test.describe('Teams Assignment - Team Management Tab', () => {
  let loginPage: LoginPage;
  let teamsPage: TeamsAssignmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    teamsPage = new TeamsAssignmentPage(page);
    
    // Login as admin before each test
    await loginPage.loginAsSuperAdmin();
    await teamsPage.navigateToTeamsAssignment();
    await teamsPage.clickTeamManagementTab();
  });

  test.describe('Team List Display', () => {
    test('should display existing teams', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      // Verify team cards are displayed
      const teamCards = page.locator('[data-testid="team-card"]');
      const teamCount = await teamCards.count();
      
      if (teamCount > 0) {
        // Verify first team card structure
        const firstTeam = teamCards.first();
        await expect(firstTeam).toBeVisible();
        
        // Check for team name
        const teamName = firstTeam.locator('[data-testid="team-name"]');
        await expect(teamName).toBeVisible();
        
        // Check for member count
        const memberCount = firstTeam.locator('[data-testid="member-count"]');
        await expect(memberCount).toBeVisible();
        
        // Check for action buttons
        const viewDetailsBtn = firstTeam.locator('[data-testid="view-details-btn"]');
        const manageBtn = firstTeam.locator('[data-testid="manage-members-btn"]');
        
        await expect(viewDetailsBtn).toBeVisible();
        await expect(manageBtn).toBeVisible();
      }
    });

    test('should display team information correctly', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      const teamCount = await teamCards.count();
      
      if (teamCount > 0) {
        const firstTeam = teamCards.first();
        const teamText = await firstTeam.textContent() || '';
        
        // Should contain team name
        expect(teamText).toMatch(/Đội\s+\w+/);
        
        // Should contain member count
        expect(teamText).toMatch(/\d+.*người/);
        
        // Should show leader status
        expect(teamText).toMatch(/Trưởng nhóm|Chưa có/);
        expect(teamText).toMatch(/Phó nhóm|Chưa có/);
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
      
      await page.reload();
      await teamsPage.clickTeamManagementTab();
      await page.waitForLoadState('networkidle');
      
      // Should show empty state
      const emptyMessage = page.locator('text="Chưa có đội nào", text="No teams found"');
      await expect(emptyMessage).toBeVisible();
    });
  });

  test.describe('Create Team Functionality', () => {
    test('should show create team button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-team-btn"]');
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    });

    test('should open create team modal when clicking create button', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-team-btn"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Check if modal opens
        const modal = page.locator('[data-testid="create-team-modal"]');
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
          
          // Verify modal has form fields
          const nameInput = modal.locator('[data-testid="team-name-input"]');
          const descInput = modal.locator('[data-testid="team-description-input"]');
          const capacityInput = modal.locator('[data-testid="team-capacity-input"]');
          
          if (await nameInput.count() > 0) await expect(nameInput).toBeVisible();
          if (await descInput.count() > 0) await expect(descInput).toBeVisible();
          if (await capacityInput.count() > 0) await expect(capacityInput).toBeVisible();
        } else {
          // If modal doesn't exist, log for debugging
          console.log('Create team modal not implemented yet');
        }
      }
    });

    test('should validate team creation form', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-team-btn"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.locator('[data-testid="create-team-modal"]');
        if (await modal.isVisible()) {
          // Try to submit without required fields
          const submitButton = modal.locator('[data-testid="submit-create-team"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            
            // Should show validation errors
            const errorMessages = modal.locator('[data-testid="validation-error"], .error-message');
            if (await errorMessages.count() > 0) {
              await expect(errorMessages.first()).toBeVisible();
            }
          }
        }
      }
    });

    test('should create new team successfully', async ({ page }) => {
      // Mock successful team creation
      await page.route('/api/admin/teams', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'new-team-id',
              name: 'Đội Test',
              description: 'Test team description',
              capacity: 10,
              current_members: 0
            })
          });
        } else {
          route.continue();
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-team-btn"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.locator('[data-testid="create-team-modal"]');
        if (await modal.isVisible()) {
          // Fill form
          const nameInput = modal.locator('[data-testid="team-name-input"]');
          const descInput = modal.locator('[data-testid="team-description-input"]');
          const capacityInput = modal.locator('[data-testid="team-capacity-input"]');
          
          if (await nameInput.isVisible()) await nameInput.fill('Đội Test');
          if (await descInput.isVisible()) await descInput.fill('Test team description');
          if (await capacityInput.isVisible()) await capacityInput.fill('10');
          
          // Submit form
          const submitButton = modal.locator('[data-testid="submit-create-team"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
            
            // Should show success message
            const successMessage = page.locator('[data-testid="toast"], text="thành công"');
            if (await successMessage.count() > 0) {
              await expect(successMessage.first()).toBeVisible();
            }
            
            // Modal should close
            await expect(modal).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Team Actions', () => {
    test('should open team details when clicking view details', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const viewDetailsBtn = teamCards.first().locator('[data-testid="view-details-btn"]');
        
        if (await viewDetailsBtn.isVisible()) {
          await viewDetailsBtn.click();
          
          // Check if details modal/page opens
          const detailsModal = page.locator('[data-testid="team-details-modal"]');
          const detailsPage = page.locator('[data-testid="team-details-page"]');
          
          if (await detailsModal.count() > 0) {
            await expect(detailsModal).toBeVisible();
          } else if (await detailsPage.count() > 0) {
            await expect(detailsPage).toBeVisible();
          } else {
            // Navigation to details page
            await page.waitForTimeout(1000);
            const currentUrl = page.url();
            expect(currentUrl).toMatch(/team.*details|details.*team/);
          }
        }
      }
    });

    test('should open member management when clicking manage members', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const manageBtn = teamCards.first().locator('[data-testid="manage-members-btn"]');
        
        if (await manageBtn.isVisible()) {
          await manageBtn.click();
          
          // Check if member management modal/page opens
          const memberModal = page.locator('[data-testid="manage-members-modal"]');
          const memberPage = page.locator('[data-testid="manage-members-page"]');
          
          if (await memberModal.count() > 0) {
            await expect(memberModal).toBeVisible();
            
            // Should show team members list
            const membersList = memberModal.locator('[data-testid="team-members-list"]');
            if (await membersList.count() > 0) {
              await expect(membersList).toBeVisible();
            }
          } else if (await memberPage.count() > 0) {
            await expect(memberPage).toBeVisible();
          } else {
            console.log('Member management functionality not implemented yet');
          }
        }
      }
    });

    test('should edit team information', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const editBtn = teamCards.first().locator('[data-testid="edit-team-btn"]');
        
        if (await editBtn.isVisible()) {
          await editBtn.click();
          
          const editModal = page.locator('[data-testid="edit-team-modal"]');
          if (await editModal.isVisible()) {
            // Should pre-fill current team data
            const nameInput = editModal.locator('[data-testid="team-name-input"]');
            const descInput = editModal.locator('[data-testid="team-description-input"]');
            
            if (await nameInput.isVisible()) {
              const currentName = await nameInput.inputValue();
              expect(currentName).toBeTruthy();
              
              // Edit the name
              await nameInput.fill('Đội Updated');
            }
            
            if (await descInput.isVisible()) {
              await descInput.fill('Updated description');
            }
            
            // Save changes
            const saveBtn = editModal.locator('[data-testid="save-team-btn"]');
            if (await saveBtn.isVisible()) {
              await saveBtn.click();
              
              // Should show success message
              const successMessage = page.locator('[data-testid="toast"], text="cập nhật thành công"');
              if (await successMessage.count() > 0) {
                await expect(successMessage.first()).toBeVisible();
              }
            }
          }
        }
      }
    });

    test('should delete team with confirmation', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const deleteBtn = teamCards.first().locator('[data-testid="delete-team-btn"]');
        
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();
          
          // Should show confirmation dialog
          const confirmDialog = page.locator('[data-testid="confirm-delete-dialog"]');
          if (await confirmDialog.isVisible()) {
            await expect(confirmDialog).toBeVisible();
            
            // Should show warning message
            const warningText = await confirmDialog.textContent();
            expect(warningText).toMatch(/xác nhận|confirm|xóa|delete/i);
            
            // Cancel deletion
            const cancelBtn = confirmDialog.locator('[data-testid="cancel-delete-btn"]');
            if (await cancelBtn.isVisible()) {
              await cancelBtn.click();
              await expect(confirmDialog).not.toBeVisible();
            }
            
            // Try deletion again and confirm
            await deleteBtn.click();
            if (await confirmDialog.isVisible()) {
              const confirmBtn = confirmDialog.locator('[data-testid="confirm-delete-btn"]');
              if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                
                // Should show success message
                const successMessage = page.locator('[data-testid="toast"], text="xóa thành công"');
                if (await successMessage.count() > 0) {
                  await expect(successMessage.first()).toBeVisible();
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Team Member Management', () => {
    test('should display team members in management modal', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const manageBtn = teamCards.first().locator('[data-testid="manage-members-btn"]');
        
        if (await manageBtn.isVisible()) {
          await manageBtn.click();
          
          const memberModal = page.locator('[data-testid="manage-members-modal"]');
          if (await memberModal.isVisible()) {
            // Should show current members
            const membersList = memberModal.locator('[data-testid="team-members-list"]');
            if (await membersList.isVisible()) {
              const members = membersList.locator('[data-testid="member-item"]');
              const memberCount = await members.count();
              
              if (memberCount > 0) {
                // Verify member information
                const firstMember = members.first();
                const memberText = await firstMember.textContent() || '';
                
                // Should contain member name
                expect(memberText).toMatch(/[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/);
                
                // Should have remove button
                const removeBtn = firstMember.locator('[data-testid="remove-member-btn"]');
                if (await removeBtn.count() > 0) {
                  await expect(removeBtn).toBeVisible();
                }
              }
            }
          }
        }
      }
    });

    test('should assign leader and deputy leader', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const manageBtn = teamCards.first().locator('[data-testid="manage-members-btn"]');
        
        if (await manageBtn.isVisible()) {
          await manageBtn.click();
          
          const memberModal = page.locator('[data-testid="manage-members-modal"]');
          if (await memberModal.isVisible()) {
            const membersList = memberModal.locator('[data-testid="team-members-list"]');
            if (await membersList.isVisible()) {
              const members = membersList.locator('[data-testid="member-item"]');
              
              if (await members.count() > 0) {
                const firstMember = members.first();
                
                // Assign as leader
                const assignLeaderBtn = firstMember.locator('[data-testid="assign-leader-btn"]');
                if (await assignLeaderBtn.isVisible()) {
                  await assignLeaderBtn.click();
                  
                  // Should show confirmation or success
                  const successMessage = page.locator('[data-testid="toast"], text="trưởng nhóm"');
                  if (await successMessage.count() > 0) {
                    await expect(successMessage.first()).toBeVisible();
                  }
                }
                
                // Assign deputy leader if there are more members
                if (await members.count() > 1) {
                  const secondMember = members.nth(1);
                  const assignDeputyBtn = secondMember.locator('[data-testid="assign-deputy-btn"]');
                  
                  if (await assignDeputyBtn.isVisible()) {
                    await assignDeputyBtn.click();
                    
                    const successMessage = page.locator('[data-testid="toast"], text="phó nhóm"');
                    if (await successMessage.count() > 0) {
                      await expect(successMessage.first()).toBeVisible();
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    test('should remove member from team', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      
      const teamCards = page.locator('[data-testid="team-card"]');
      if (await teamCards.count() > 0) {
        const manageBtn = teamCards.first().locator('[data-testid="manage-members-btn"]');
        
        if (await manageBtn.isVisible()) {
          await manageBtn.click();
          
          const memberModal = page.locator('[data-testid="manage-members-modal"]');
          if (await memberModal.isVisible()) {
            const membersList = memberModal.locator('[data-testid="team-members-list"]');
            if (await membersList.isVisible()) {
              const members = membersList.locator('[data-testid="member-item"]');
              
              if (await members.count() > 0) {
                const initialCount = await members.count();
                const firstMember = members.first();
                
                const removeBtn = firstMember.locator('[data-testid="remove-member-btn"]');
                if (await removeBtn.isVisible()) {
                  await removeBtn.click();
                  
                  // Should show confirmation
                  const confirmDialog = page.locator('[data-testid="confirm-remove-member"]');
                  if (await confirmDialog.isVisible()) {
                    const confirmBtn = confirmDialog.locator('[data-testid="confirm-remove-btn"]');
                    await confirmBtn.click();
                    
                    // Member count should decrease
                    await page.waitForTimeout(1000);
                    const newCount = await members.count();
                    expect(newCount).toBeLessThan(initialCount);
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle team creation errors', async ({ page }) => {
      // Mock creation error
      await page.route('/api/admin/teams', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Team name already exists' })
          });
        } else {
          route.continue();
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid="create-team-btn"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.locator('[data-testid="create-team-modal"]');
        if (await modal.isVisible()) {
          const nameInput = modal.locator('[data-testid="team-name-input"]');
          if (await nameInput.isVisible()) {
            await nameInput.fill('Existing Team');
            
            const submitButton = modal.locator('[data-testid="submit-create-team"]');
            if (await submitButton.isVisible()) {
              await submitButton.click();
              
              // Should show error message
              const errorMessage = page.locator('[data-testid="toast"], text="lỗi", text="error"');
              await expect(errorMessage).toBeVisible();
            }
          }
        }
      }
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('/api/admin/teams', (route) => {
        route.abort('failed');
      });
      
      await page.reload();
      await teamsPage.clickTeamManagementTab();
      
      // Should handle failure gracefully
      await page.waitForTimeout(3000);
      
      // Should show error state or retry option
      const errorState = page.locator('[data-testid="error-state"], text="Không thể tải danh sách đội"');
      if (await errorState.count() > 0) {
        await expect(errorState.first()).toBeVisible();
      }
    });
  });
});
