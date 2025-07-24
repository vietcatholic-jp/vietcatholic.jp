import { Page, expect } from '@playwright/test';

/**
 * Test utility functions for Teams Assignment testing
 */

/**
 * Wait for all network requests to complete
 */
export async function waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Clear all browser data
 */
export async function clearBrowserData(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.context().clearPermissions();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Mock API response with custom data
 */
export async function mockApiResponse(
  page: Page, 
  url: string | RegExp, 
  responseData: any, 
  status = 200
): Promise<void> {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });
}

/**
 * Mock API error response
 */
export async function mockApiError(
  page: Page, 
  url: string | RegExp, 
  errorMessage: string, 
  status = 500
): Promise<void> {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: errorMessage })
    });
  });
}

/**
 * Wait for toast notification and verify message
 */
export async function waitForToast(
  page: Page, 
  expectedMessage?: string, 
  timeout = 10000
): Promise<void> {
  const toastSelectors = [
    '[data-testid="toast"]',
    '.toast',
    '[role="alert"]',
    '.notification'
  ];
  
  let toast;
  for (const selector of toastSelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      toast = element.first();
      break;
    }
  }
  
  if (toast) {
    await toast.waitFor({ state: 'visible', timeout });
    
    if (expectedMessage) {
      await expect(toast).toContainText(expectedMessage);
    }
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page, 
  name: string, 
  fullPage = true
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  
  await page.screenshot({ 
    path: `tests/reports/screenshots/${filename}`,
    fullPage 
  });
}

/**
 * Get console errors from page
 */
export async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Verify no console errors
 */
export async function verifyNoConsoleErrors(page: Page): Promise<void> {
  const errors = await getConsoleErrors(page);
  const criticalErrors = errors.filter(error => 
    !error.includes('favicon') && 
    !error.includes('404') &&
    !error.includes('net::ERR_FAILED')
  );
  
  expect(criticalErrors).toHaveLength(0);
}

/**
 * Wait for element to be stable (not moving)
 */
export async function waitForElementStable(
  page: Page, 
  selector: string, 
  timeout = 5000
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  
  let previousBox = await element.boundingBox();
  let stableCount = 0;
  const requiredStableCount = 3;
  
  while (stableCount < requiredStableCount && timeout > 0) {
    await page.waitForTimeout(100);
    timeout -= 100;
    
    const currentBox = await element.boundingBox();
    
    if (previousBox && currentBox &&
        previousBox.x === currentBox.x &&
        previousBox.y === currentBox.y &&
        previousBox.width === currentBox.width &&
        previousBox.height === currentBox.height) {
      stableCount++;
    } else {
      stableCount = 0;
    }
    
    previousBox = currentBox;
  }
}

/**
 * Fill form field with validation
 */
export async function fillFormField(
  page: Page, 
  selector: string, 
  value: string, 
  shouldValidate = true
): Promise<void> {
  const field = page.locator(selector);
  await field.waitFor({ state: 'visible' });
  await field.fill(value);
  
  if (shouldValidate) {
    // Trigger validation by blurring the field
    await field.blur();
    await page.waitForTimeout(500);
  }
}

/**
 * Select dropdown option by text
 */
export async function selectDropdownOption(
  page: Page, 
  selectSelector: string, 
  optionText: string
): Promise<void> {
  const select = page.locator(selectSelector);
  await select.click();
  
  const option = page.locator(`[role="option"]:has-text("${optionText}")`);
  await option.click();
}

/**
 * Verify table data
 */
export async function verifyTableData(
  page: Page, 
  tableSelector: string, 
  expectedData: any[]
): Promise<void> {
  const rows = page.locator(`${tableSelector} tbody tr`);
  const rowCount = await rows.count();
  
  expect(rowCount).toBe(expectedData.length);
  
  for (let i = 0; i < expectedData.length; i++) {
    const row = rows.nth(i);
    const rowText = await row.textContent() || '';
    
    for (const [key, value] of Object.entries(expectedData[i])) {
      expect(rowText).toContain(String(value));
    }
  }
}

/**
 * Verify API response structure
 */
export function verifyApiResponseStructure(
  data: any, 
  expectedStructure: Record<string, string>
): void {
  for (const [field, type] of Object.entries(expectedStructure)) {
    expect(data).toHaveProperty(field);
    expect(typeof data[field]).toBe(type);
  }
}

/**
 * Generate test data
 */
export function generateTestRegistrant(overrides: Partial<any> = {}): any {
  return {
    id: `test-${Date.now()}`,
    full_name: 'NGUYỄN VĂN TEST',
    registration_code: `DH${Date.now()}`,
    gender: 'male',
    age: 25,
    province: 'Hà Nội',
    diocese: 'Hà Nội',
    role: 'participant',
    team_id: null,
    ...overrides
  };
}

/**
 * Generate test team
 */
export function generateTestTeam(overrides: Partial<any> = {}): any {
  return {
    id: `team-${Date.now()}`,
    name: `Đội Test ${Date.now()}`,
    description: 'Test team description',
    capacity: null,
    current_members: 0,
    leader_id: null,
    deputy_leader_id: null,
    ...overrides
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Verify responsive design at different breakpoints
 */
export async function verifyResponsiveDesign(
  page: Page,
  breakpoints = [
    { width: 1920, height: 1080, name: 'Desktop Large' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ]
): Promise<void> {
  for (const breakpoint of breakpoints) {
    await page.setViewportSize({ 
      width: breakpoint.width, 
      height: breakpoint.height 
    });
    
    await page.waitForTimeout(500);
    
    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(breakpoint.width + 20);
    
    // Take screenshot for visual verification
    await takeTimestampedScreenshot(page, `responsive-${breakpoint.name.toLowerCase().replace(' ', '-')}`);
  }
}

/**
 * Verify accessibility basics
 */
export async function verifyAccessibility(page: Page): Promise<void> {
  // Check for proper heading hierarchy
  const headings = page.locator('h1, h2, h3, h4, h5, h6');
  const headingCount = await headings.count();
  expect(headingCount).toBeGreaterThan(0);
  
  // Check for ARIA labels
  const ariaElements = page.locator('[aria-label], [aria-labelledby], [role]');
  const ariaCount = await ariaElements.count();
  expect(ariaCount).toBeGreaterThan(0);
  
  // Check for alt text on images
  const images = page.locator('img');
  const imageCount = await images.count();
  
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    const ariaLabel = await img.getAttribute('aria-label');
    
    expect(alt !== null || ariaLabel !== null).toBeTruthy();
  }
}
