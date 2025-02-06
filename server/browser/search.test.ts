import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import type { SearchResult } from './search';
import { SearchBrowser } from './search';

describe('SearchBrowser', () => {
  const TIMEOUT = 5 * 60 * 1000; // reCAPTCHA入力のためタイムアウト(5分)
  let search: SearchBrowser;

  beforeEach(async () => {
    search = new SearchBrowser();
    await search.initialize();
  });

  afterEach(async () => {
    await search.close();
  });

  it(
    'should search with multiple themes and return results',
    async () => {
      console.log('\n⚠️ reCAPTCHAが表示された場合は手動で入力してください。\n');
      const result = await search.searchWithQueries({
        searchThemes: [
          {
            theme: 'What is ChatGPT?',
            keywords: ['ChatGPT', 'GPT Model', 'LLM'],
          },
          {
            theme: 'What ChatGPT can make changes for our lives?',
            keywords: ['ChatGPT features', 'ChatGPT applications', 'ChatGPT use cases'],
          },
          {
            theme: 'How to use ChatGPT?',
            keywords: ['ChatGPT usage', 'ChatGPT tutorial', 'ChatGPT guide'],
          },
        ],
        searchConfig: {
          lang: 'en',
          instruction: 'Emphasize the importance of ChatGPT in the world.',
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expectTypeOf(result[0]).toEqualTypeOf<SearchResult>();
    },
    TIMEOUT
  );
});
