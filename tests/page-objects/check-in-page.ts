import { Page, Locator } from '@playwright/test';

export class CheckInPage {
  readonly page: Page;
  readonly startScanButton: Locator;
  readonly stopScanButton: Locator;
  readonly cameraView: Locator;
  readonly statsCheckedIn: Locator;
  readonly statsLastScan: Locator;
  readonly statsStatus: Locator;
  readonly scanningOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startScanButton = page.locator('button:has-text("Bắt đầu quét")');
    this.stopScanButton = page.locator('button:has-text("Dừng quét")');
    this.cameraView = page.locator('video');
    this.statsCheckedIn = page.locator('[data-testid="stats-checked-in"]');
    this.statsLastScan = page.locator('[data-testid="stats-last-scan"]');
    this.statsStatus = page.locator('[data-testid="stats-status"]');
    this.scanningOverlay = page.locator('.border-dashed');
  }

  async goto() {
    await this.page.goto('/check-in');
  }

  async startScanning() {
    await this.startScanButton.click();
  }

  async stopScanning() {
    await this.stopScanButton.click();
  }

  async waitForScanningToStart() {
    await this.stopScanButton.waitFor({ state: 'visible' });
    await this.scanningOverlay.waitFor({ state: 'visible' });
  }

  async waitForScanningToStop() {
    await this.startScanButton.waitFor({ state: 'visible' });
  }

  async getCheckInCount(): Promise<string> {
    return await this.statsCheckedIn.textContent() || '0';
  }

  async getLastScanTime(): Promise<string> {
    return await this.statsLastScan.textContent() || '';
  }

  async getStatus(): Promise<string> {
    return await this.statsStatus.textContent() || '';
  }

  async simulateQRScan(qrData: string) {
    // Simulate QR code scan by dispatching custom event
    await this.page.evaluate((data) => {
      window.dispatchEvent(new CustomEvent('mock-qr-scan', { 
        detail: { qrData: data } 
      }));
    }, qrData);
  }

  async waitForDialog() {
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  }

  async closeDialog() {
    await this.page.locator('button:has-text("Tiếp tục quét")').click();
  }

  async confirmDialog() {
    await this.page.locator('button:has-text("Hoàn tất")').click();
  }
}
