import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { UI_SELECTORS, MOCK_STATS } from '../fixtures/test-data';

/**
 * Teams Assignment Page Object Model
 */
export class TeamsAssignmentPage extends BasePage {
  // Tab selectors
  private readonly overviewTab = UI_SELECTORS.TABS.OVERVIEW;
  private readonly unassignedTab = UI_SELECTORS.TABS.UNASSIGNED;
  private readonly teamManagementTab = UI_SELECTORS.TABS.TEAM_MANAGEMENT;

  // Overview tab elements
  private readonly totalTeamsCard = '[data-testid="total-teams-card"]';
  private readonly assignedCard = '[data-testid="assigned-card"]';
  private readonly unassignedCard = '[data-testid="unassigned-card"]';
  private readonly assignmentPercentageCard = '[data-testid="assignment-percentage-card"]';

  // Unassigned tab elements
  private readonly searchInput = UI_SELECTORS.FORMS.SEARCH_INPUT;
  private readonly selectAllCheckbox = UI_SELECTORS.BUTTONS.SELECT_ALL;
  private readonly assignTeamButtons = UI_SELECTORS.BUTTONS.ASSIGN_TEAM;
  private readonly bulkAssignButton = UI_SELECTORS.BUTTONS.BULK_ASSIGN;

  // Team management tab elements
  private readonly createTeamButton = UI_SELECTORS.BUTTONS.CREATE_TEAM;
  private readonly teamCards = '[data-testid="team-card"]';

  // Modal elements
  private readonly assignTeamModal = UI_SELECTORS.MODALS.ASSIGN_TEAM;
  private readonly teamSelect = UI_SELECTORS.FORMS.TEAM_SELECT;
  private readonly notesInput = UI_SELECTORS.FORMS.NOTES_INPUT;
  private readonly confirmAssignButton = '[data-testid="confirm-assign-btn"]';
  private readonly cancelButton = '[data-testid="cancel-btn"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to teams assignment page
   */
  async navigateToTeamsAssignment(): Promise<void> {
    await this.goto('/admin/teams-assignment');
    await this.waitForPageLoad();
  }

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded(): Promise<void> {
    await this.verifyUrlContains('/admin/teams-assignment');
    await this.waitForElement(this.overviewTab);
    await this.waitForElement(this.unassignedTab);
    await this.waitForElement(this.teamManagementTab);
  }

  // ===== TAB NAVIGATION =====

  /**
   * Click on Overview tab
   */
  async clickOverviewTab(): Promise<void> {
    await this.clickElement(this.overviewTab);
    await this.waitForPageLoad();
  }

  /**
   * Click on Unassigned tab
   */
  async clickUnassignedTab(): Promise<void> {
    await this.clickElement(this.unassignedTab);
    await this.waitForPageLoad();
  }

  /**
   * Click on Team Management tab
   */
  async clickTeamManagementTab(): Promise<void> {
    await this.clickElement(this.teamManagementTab);
    await this.waitForPageLoad();
  }

  // ===== OVERVIEW TAB =====

  /**
   * Verify overview statistics
   */
  async verifyOverviewStats(expectedStats: typeof MOCK_STATS.OVERVIEW): Promise<void> {
    await this.clickOverviewTab();
    
    // Verify total teams
    const totalTeamsText = await this.getTextContent(this.totalTeamsCard);
    expect(totalTeamsText).toContain(expectedStats.total_teams.toString());

    // Verify assigned count
    const assignedText = await this.getTextContent(this.assignedCard);
    expect(assignedText).toContain(expectedStats.total_assigned.toString());

    // Verify unassigned count
    const unassignedText = await this.getTextContent(this.unassignedCard);
    expect(unassignedText).toContain(expectedStats.total_unassigned.toString());

    // Verify assignment percentage
    const percentageText = await this.getTextContent(this.assignmentPercentageCard);
    expect(percentageText).toContain(`${expectedStats.assignment_percentage}%`);
  }

  /**
   * Verify charts are displayed
   */
  async verifyChartsDisplayed(): Promise<void> {
    await this.clickOverviewTab();
    
    const chartSelectors = [
      '[data-testid="team-distribution-chart"]',
      '[data-testid="gender-distribution-chart"]',
      '[data-testid="age-distribution-chart"]'
    ];

    for (const selector of chartSelectors) {
      await this.waitForElement(selector);
    }
  }

  // ===== UNASSIGNED TAB =====

  /**
   * Search for registrants
   */
  async searchRegistrants(searchTerm: string): Promise<void> {
    await this.clickUnassignedTab();
    await this.fillInput(this.searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Select all registrants
   */
  async selectAllRegistrants(): Promise<void> {
    await this.clickUnassignedTab();
    await this.clickElement(this.selectAllCheckbox);
  }

  /**
   * Get count of unassigned registrants
   */
  async getUnassignedCount(): Promise<number> {
    await this.clickUnassignedTab();
    const countText = await this.getTextContent('[data-testid="unassigned-count"]');
    const match = countText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Click assign team button for specific registrant
   */
  async clickAssignTeamForRegistrant(registrantName: string): Promise<void> {
    await this.clickUnassignedTab();
    const registrantRow = this.page.locator(`[data-testid="registrant-row"]:has-text("${registrantName}")`);
    const assignButton = registrantRow.locator(this.assignTeamButtons);
    await assignButton.click();
  }

  // ===== TEAM MANAGEMENT TAB =====

  /**
   * Click create team button
   */
  async clickCreateTeam(): Promise<void> {
    await this.clickTeamManagementTab();
    await this.clickElement(this.createTeamButton);
  }

  /**
   * Get team cards count
   */
  async getTeamCardsCount(): Promise<number> {
    await this.clickTeamManagementTab();
    const teamCards = this.page.locator(this.teamCards);
    return await teamCards.count();
  }

  /**
   * Verify team card information
   */
  async verifyTeamCard(teamName: string, memberCount: number): Promise<void> {
    await this.clickTeamManagementTab();
    const teamCard = this.page.locator(`${this.teamCards}:has-text("${teamName}")`);
    await expect(teamCard).toBeVisible();
    await expect(teamCard).toContainText(`${memberCount}`);
  }

  // ===== ASSIGN TEAM MODAL =====

  /**
   * Verify assign team modal is open
   */
  async verifyAssignTeamModalOpen(registrantName: string): Promise<void> {
    await this.waitForElement(this.assignTeamModal);
    const modalTitle = this.page.locator(`${this.assignTeamModal} h2, ${this.assignTeamModal} .modal-title`);
    await expect(modalTitle).toContainText(registrantName);
  }

  /**
   * Select team in modal
   */
  async selectTeamInModal(teamName: string): Promise<void> {
    await this.clickElement(this.teamSelect);
    const teamOption = this.page.locator(`[role="option"]:has-text("${teamName}")`);
    await teamOption.click();
  }

  /**
   * Add notes in modal
   */
  async addNotesInModal(notes: string): Promise<void> {
    await this.fillInput(this.notesInput, notes);
  }

  /**
   * Confirm team assignment
   */
  async confirmTeamAssignment(): Promise<void> {
    await this.clickElement(this.confirmAssignButton);
  }

  /**
   * Cancel team assignment
   */
  async cancelTeamAssignment(): Promise<void> {
    await this.clickElement(this.cancelButton);
  }

  /**
   * Complete team assignment process
   */
  async assignRegistrantToTeam(registrantName: string, teamName: string, notes?: string): Promise<void> {
    await this.clickAssignTeamForRegistrant(registrantName);
    await this.verifyAssignTeamModalOpen(registrantName);
    await this.selectTeamInModal(teamName);
    
    if (notes) {
      await this.addNotesInModal(notes);
    }
    
    await this.confirmTeamAssignment();
    await this.waitForPageLoad();
  }

  // ===== RESPONSIVE DESIGN =====

  /**
   * Test responsive design on different screen sizes
   */
  async testResponsiveDesign(): Promise<void> {
    const viewports = [
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.verifyPageLoaded();
      await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
    }
  }
}
