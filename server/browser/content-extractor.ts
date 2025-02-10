import type { Page } from 'playwright';
import { BrowserManager } from './browser-manager';
import type { SearchResult, SearchResultItem } from './search';

// 定数の切り出し
const mainSelectors = [
  'main',
  'article',
  '.article',
  '#article',
  '.post-content',
  '.entry-content',
  '.content',
  '#content',
  '.main',
  '#main',
  '.doc',
  '#doc',
  '.documentation',
  '#documentation',
  '.text',
  '#text',
  'section',
  '.blog-post',
  '#blog-post',
  '.news-article',
  '#news-article',
  '.post-body',
  '#post-body',
  '.article-body',
  '#article-body',
  '.article-content',
  '#article-content',
  '.post-content',
  '#post-content',
  '.blog-content',
  '#blog-content',
  '.news-content',
  '#news-content',
  '.text-content',
  '#text-content',
  '.main-content',
  '#main-content',
  '.main-article',
  '#main-article',
  '.post-article',
  '#post-article',
  '.blog-article',
  '#blog-article',
  '.news-article',
  '#news-article',
  '.story',
  '.story-content',
  '.post',
  '.post-inner',
  '.entry',
  '.entry-inner',
  '.page',
  '.page-inner',
  '.text-block',
  '.text-wrapper',
  '.content-area',
  '.content-inner',
  '.content-wrapper',
  '.content-main',
  '.article-text',
  '.article-inner',
  '.article-wrapper',
  '.post-text',
  '.post-inner',
  '.post-wrapper',
  '.blog-text',
  '.blog-inner',
  '.blog-wrapper',
  '.news-text',
  '.news-inner',
  '.news-wrapper',
];

const removeSelectors = ['header', 'footer', 'nav', 'aside', 'style', 'script', 'noscript', '[role="complementary"]', '[role="navigation"]'];

export interface ContentResultItem extends SearchResultItem {
  content: string;
}

export interface ContentResult {
  theme: string;
  results: ContentResultItem[];
}

export class ContentExtractor extends BrowserManager {
  protected static instance: ContentExtractor;

  protected constructor() {
    super();
  }

  static getInstance(): ContentExtractor {
    if (!ContentExtractor.instance) {
      ContentExtractor.instance = new ContentExtractor();
    }
    return ContentExtractor.instance;
  }

  private async extractMainContent(page: Page): Promise<string> {
    return await page.evaluate(() => {
      for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return (element as HTMLElement).innerText.trim() || '';
        }
      }
      const body = document.body;
      removeSelectors.forEach((selector: string) => {
        document.querySelectorAll(selector).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      });
      const text = body.innerText.replace(/\s+/g, ' ').trim();
      removeSelectors.forEach((selector: string) => {
        document.querySelectorAll(selector).forEach((el) => {
          (el as HTMLElement).style.display = '';
        });
      });
      return text;
    });
  }

  async extractContent(searchResults: SearchResult[]): Promise<ContentResult[]> {
    const browser = this.getBrowser();
    if (!browser) {
      throw new Error('Browser not initialized');
    }
    const contentResults: ContentResult[] = [];
    const context = await this.createContext();
    try {
      for (const searchResult of searchResults) {
        const extendedItems: ContentResultItem[] = [];
        for (const result of searchResult.results) {
          try {
            const page = await context.newPage();
            await page.goto(result.link, { timeout: 30000 });
            await page.waitForURL(result.link, { timeout: 10000 }).catch(() => {});
            const content = await this.extractMainContent(page);
            extendedItems.push({ ...result, content });
            await page.close();
          } catch (error) {
            console.error(`Error extracting content from ${result.link}:`, error);
            continue;
          }
          await this.delay(1000); // レート制限対策
        }
        contentResults.push({ theme: searchResult.theme, results: extendedItems });
      }
    } finally {
      await context.close();
    }
    return contentResults;
  }
}
