import type { Browser, BrowserContext } from 'playwright';
import { chromium } from 'playwright';

export abstract class BrowserManager {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;

  protected constructor() {}

  protected static instance: BrowserManager;

  static getInstance(): BrowserManager {
    throw new Error('getInstance() must be implemented by child class');
  }

  async initialize(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        channel: 'chrome',
        headless: false, // reCAPTCHA対策
      });
      this.context = await this.browser.newContext();
    }
    return this.browser;
  }

  getBrowser(): Browser | null {
    return this.browser;
  }

  getContext(): BrowserContext | null {
    return this.context;
  }

  async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    return await this.browser.newContext();
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ユーティリティメソッド
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
