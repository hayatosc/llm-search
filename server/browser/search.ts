import type { Page } from 'playwright';
import type { z } from 'zod';
import { SearchQueries } from '../prompts/search';
import { BrowserManager } from './browser-manager';

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

export class SearchBrowser extends BrowserManager {
  private static instance: SearchBrowser;

  protected constructor() {
    super();
  }

  static getInstance(): SearchBrowser {
    if (!SearchBrowser.instance) {
      SearchBrowser.instance = new SearchBrowser();
    }
    return SearchBrowser.instance;
  }

  // 言語パラメータの取得
  private getLanguageParam(lang: string): string {
    const langMap: Record<string, string> = {
      ja: '&lr=lang_ja',
      en: '&lr=lang_en',
    };
    return langMap[lang] || '';
  }

  // ページ内の検索結果抽出
  private async extractResults(page: Page): Promise<SearchResultItem[]> {
    return await page.evaluate(() => {
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
  }

  async searchWithQueries(queries: SearchQueriesType): Promise<Array<SearchResult>> {
    const browser = this.getBrowser();
    if (!browser) {
      throw new Error('Browser not initialized');
    }

    const results: Array<SearchResult> = [];
    const context = await this.createContext();
    const searchLang = this.getLanguageParam(queries.searchConfig.lang);

    try {
      for (const query of queries.searchThemes) {
        const page = await context.newPage();
        const searchResults = new Set<string>();
        const searchAttempts = [query.theme, ...query.keywords];

        for (const searchQuery of searchAttempts) {
          try {
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery) + searchLang;
            await page.goto(googleUrl);
            await page.waitForURL(/search\?q/);

            const items = await this.extractResults(page);
            items.forEach(({ title, snippet, link }) => {
              if (title && snippet && link) {
                searchResults.add(JSON.stringify({ title, snippet, link }));
              }
            });

            if (searchResults.size >= 5) break;
          } catch (error) {
            console.error(`Search error for query "${searchQuery}":`, error);
            continue;
          }

          await this.delay(1000);
        }

        results.push({
          theme: query.theme,
          results: Array.from(searchResults)
            .slice(0, 5)
            .map((result) => JSON.parse(result) as SearchResultItem),
        });

        await page.close();
      }
    } finally {
      await context.close();
    }

    return results;
  }
}
