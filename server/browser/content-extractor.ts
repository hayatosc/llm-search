import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright';
import type { SearchResult, SearchResultItem } from './search';

export interface ContentResultItem extends SearchResultItem {
  content: string;
}

export interface ContentResult {
  theme: string;
  results: ContentResultItem[];
}

export class ContentExtractor {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      channel: 'chrome',
      headless: false, // reCAPTCHA対策
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      // メインコンテンツを抽出するためのセレクタ候補
      const selectors = ['article', 'main', '[role="main"]', '.main-content', '#main-content', '.post-content', '.article-content'];

      // セレクタに基づいてメインコンテンツを探す
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent || '';
        }
      }

      // メインコンテンツが見つからない場合は、bodyから不要な要素を除外して取得
      const body = document.body;
      const elementsToRemove = ['header', 'footer', 'nav', 'aside', 'style', 'script', 'noscript', '[role="complementary"]', '[role="navigation"]'];

      // 不要な要素を非表示にする
      elementsToRemove.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      });

      // クリーンなテキストを取得
      const text = body.textContent || '';

      // 元の表示状態を戻す
      elementsToRemove.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          (el as HTMLElement).style.display = '';
        });
      });

      return text
        .replace(/\s+/g, ' ') // 連続する空白を1つに
        .replace(/\n+/g, '\n') // 連続する改行を1つに
        .trim();
    });
  }

  async extractContent(searchResults: SearchResult[]): Promise<ContentResult[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const contentResults: ContentResult[] = [];
    try {
      for (const searchResult of searchResults) {
        const extendedItems: ContentResultItem[] = [];

        for (const result of searchResult.results) {
          try {
            const page = await this.browser.newPage();
            await page.goto(result.link, { timeout: 30000 });
            await page.waitForURL(result.link, { timeout: 10000 }).catch(() => {});
            const content = await this.extractMainContent(page);

            extendedItems.push({
              ...result,
              content,
            });

            await page.close();
          } catch (error) {
            console.error(`Error extracting content from ${result.link}:`, error);
            continue;
          }

          // レート制限対策
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        contentResults.push({
          theme: searchResult.theme,
          results: extendedItems,
        });
      }
    } finally {
      // ページは個別にcloseされるため、追加のクリーンアップは不要
    }

    return contentResults;
  }
}
