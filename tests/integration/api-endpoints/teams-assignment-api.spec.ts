import { test, expect } from '@playwright/test';

test.describe('Teams Assignment API', () => {
  test.beforeEach(async ({ page }) => {
    // Login to get session cookies
    await page.goto('/auth/sign-in');
    await page.fill('input[type="email"]', 'dev.thubv@gmail.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.toString().includes('/auth/sign-in'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('should get unassigned registrants', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/admin/registrants/unassigned');
      return {
        status: res.status,
        ok: res.ok,
        data: res.ok ? await res.json() : await res.text()
      };
    });

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  test('should handle assign team validation', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/admin/registrants/fake-id/assign-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_id: 'invalid-uuid'
        })
      });
      return {
        status: res.status,
        ok: res.ok,
        data: res.ok ? await res.json() : await res.json()
      };
    });

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toContain('Invalid request data');
  });

  test('should handle bulk assign validation', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/admin/registrants/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registrant_ids: ['invalid-uuid'],
          team_id: 'invalid-uuid'
        })
      });
      return {
        status: res.status,
        ok: res.ok,
        data: res.ok ? await res.json() : await res.json()
      };
    });

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toContain('Invalid request data');
  });

  test('should require authentication', async ({ browser }) => {
    // Create new context without login
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to a page first to establish base URL
    await page.goto('/');

    const response = await page.evaluate(async () => {
      const res = await fetch('/api/admin/registrants/unassigned');
      return {
        status: res.status,
        ok: res.ok
      };
    });

    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);

    await context.close();
  });
});
