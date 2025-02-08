import type { Browser } from 'playwright';
import { chromium } from 'playwright';
import type { z } from 'zod';
import { SearchQueries } from '../prompts/search';

type SearchQueriesType = z.infer<typeof SearchQueries>;

export type SearchResultItem = {
  title: string;
  snippet: string;
  link: string;
};

export type SearchResult = {
  theme: string;
  results: SearchResultItem[];
};

export class SearchBrowser {
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

  async searchWithQueries(queries: SearchQueriesType): Promise<Array<SearchResult>> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const results: Array<SearchResult> = [];
    const context = await this.browser.newContext();

    try {
      // 言語設定の判定
      let searchLang: string;
      switch (queries.searchConfig.lang) {
        case 'ja':
          searchLang = '&lr=lang_ja';
          break;
        case 'en':
          searchLang = '&lr=lang_en';
          break;
        default:
          searchLang = '';
      }

      for (const query of queries.searchThemes) {
        const page = await context.newPage();
        const searchResults = new Set<string>();

        const searchAttempts = [query.theme, ...query.keywords];

        for (const searchQuery of searchAttempts) {
          try {
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery) + searchLang;

            await page.goto(googleUrl);
            await page.waitForURL(/search\?q/);

            const results = await page.evaluate(() => {
              const elements = document.querySelectorAll('div.g');
              return Array.from(elements)
                .slice(0, 5)
                .map((element) => {
                  const title = element.querySelector('h3')?.textContent || '';
                  const snippet = element.querySelector('div[style*="webkit-line-clamp"]')?.textContent || '';
                  const linkElement = element.querySelector('a') as HTMLAnchorElement;
                  const link = linkElement?.href || '';
                  return { title, snippet, link };
                });
            });

            results.forEach(({ title, snippet, link }) => {
              if (title && snippet && link) {
                searchResults.add(JSON.stringify({ title, snippet, link }));
              }
            });

            if (searchResults.size >= 5) break;
          } catch (error) {
            console.error(`Search error for query "${searchQuery}":`, error);
            continue;
          }

          await page.waitForTimeout(1000);
        }

        results.push({
          theme: query.theme,
          results: Array.from(searchResults)
            .slice(0, 5)
            .map((result) => JSON.parse(result) as SearchResultItem),
        });
      }
    } finally {
      await context.close();
    }

    return results;
  }
}
