import type { Browser } from 'playwright';
import { chromium } from 'playwright';
import type { z } from 'zod';
import { SearchQueries } from '../prompts/search';

type SearchQueriesType = z.infer<typeof SearchQueries>;

export class SearchBrowser {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async searchWithQueries(queries: SearchQueriesType): Promise<Array<{ theme: string; results: string[] }>> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const results: Array<{ theme: string; results: string[] }> = [];
    const context = await this.browser.newContext();

    try {
      // 言語設定の判定
      const isJapaneseSearch = queries.searchConfig.lang === 'ja';

      for (const query of queries.searchThemes) {
        const page = await context.newPage();
        const searchResults = new Set<string>();

        const searchAttempts = [query.theme, ...query.keywords];

        for (const searchQuery of searchAttempts) {
          try {
            // 言語に基づいてGoogle検索URLを設定
            const googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchQuery) + (isJapaneseSearch ? '&lr=lang_ja' : '');

            await page.goto(googleUrl);

            // ページの読み込みを待機
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

            // 検索結果を取得
            const results = await page.evaluate(() => {
              const elements = document.querySelectorAll('.g');
              return Array.from(elements)
                .slice(0, 5)
                .map((element) => {
                  const title = element.querySelector('h3')?.textContent || '';
                  const snippet = element.querySelector('.VwiC3b')?.textContent || '';
                  const link = element.querySelector('a')?.href || '';
                  return { title, snippet, link };
                });
            });

            // 重複を避けながら結果を追加
            results.forEach(({ title, snippet, link }) => {
              if (title && snippet) {
                searchResults.add(`${title}\n${snippet}\n${link}`);
              }
            });

            // 十分な結果が得られた場合は次のテーマへ
            if (searchResults.size >= 5) break;
          } catch (error) {
            console.error(`Search error for query "${searchQuery}":`, error);
            continue;
          }

          // 連続した検索の間に少し待機
          await page.waitForTimeout(1000);
        }

        results.push({
          theme: query.theme,
          results: Array.from(searchResults).slice(0, 5),
        });
      }
    } finally {
      await context.close();
    }

    return results;
  }
}
