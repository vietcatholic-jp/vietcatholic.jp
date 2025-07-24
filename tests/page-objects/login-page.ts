import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { TEST_USERS } from '../fixtures/test-data';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  private readonly emailInput = '[data-testid="email-input"], input[type="email"]';
  private readonly passwordInput = '[data-testid="password-input"], input[type="password"]';
  private readonly loginButton = '[data-testid="login-button"], button[type="submit"]';
  private readonly errorMessage = '[data-testid="error-message"], .error-message';
  private readonly loadingSpinner = '[data-testid="loading"], .loading';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.goto('/auth/sign-in');
    await this.waitForPageLoad();
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
    
    // Wait for login to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login as super admin
   */
  async loginAsSuperAdmin(): Promise<void> {
    await this.navigateToLogin();
    await this.login(TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await this.verifyLoginSuccess();
  }

  /**
   * Login as event organizer
   */
  async loginAsEventOrganizer(): Promise<void> {
    await this.navigateToLogin();
    await this.login(TEST_USERS.EVENT_ORGANIZER.email, TEST_USERS.EVENT_ORGANIZER.password);
    await this.verifyLoginSuccess();
  }

  /**
   * Login as participant (should fail for admin pages)
   */
  async loginAsParticipant(): Promise<void> {
    await this.navigateToLogin();
    await this.login(TEST_USERS.PARTICIPANT.email, TEST_USERS.PARTICIPANT.password);
    await this.verifyLoginSuccess();
  }

  /**
   * Verify login was successful
   */
  async verifyLoginSuccess(): Promise<void> {
    // Should redirect to dashboard or intended page
    await expect(this.page).not.toHaveURL(/\/auth\/sign-in/);
    
    // Should not show login form
    await expect(this.page.locator(this.loginButton)).not.toBeVisible();
  }

  /**
   * Verify login failed
   */
  async verifyLoginFailed(): Promise<void> {
    // Should still be on login page
    await this.verifyUrlContains('/auth/sign-in');
    
    // Should show error message
    await this.waitForElement(this.errorMessage);
  }

  /**
   * Check if user is already logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if we're redirected away from login page
      await this.page.goto('/auth/sign-in');
      await this.page.waitForLoadState('networkidle');
      
      const currentUrl = this.page.url();
      return !currentUrl.includes('/auth/sign-in');
    } catch {
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Look for logout button/link
    const logoutSelectors = [
      '[data-testid="logout-button"]',
      'button:has-text("Đăng xuất")',
      'a:has-text("Đăng xuất")',
      '[href="/auth/sign-out"]'
    ];

    for (const selector of logoutSelectors) {
      if (await this.isElementVisible(selector)) {
        await this.clickElement(selector);
        break;
      }
    }

    // Wait for logout to complete
    await this.page.waitForLoadState('networkidle');
    await this.verifyUrlContains('/auth/sign-in');
  }

  /**
   * Verify error message appears
   */
  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    const errorElement = await this.waitForElement(this.errorMessage);
    await expect(errorElement).toContainText(expectedMessage);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoginComplete(): Promise<void> {
    // Wait for loading spinner to disappear
    if (await this.isElementVisible(this.loadingSpinner)) {
      await this.page.locator(this.loadingSpinner).waitFor({ state: 'hidden' });
    }
    
    await this.waitForPageLoad();
  }
}
