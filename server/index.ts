import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';

import { createLLMModel } from './llms';
import { createSearchPrompt, SearchQueries } from './prompts/search';
import { SearchBrowser } from './browser/search';
import { ContentExtractor } from './browser/content-extractor';

// シングルトンインスタンスを取得
const searchBrowser = SearchBrowser.getInstance();
const contentExtractor = ContentExtractor.getInstance();

export type Env = {
  Bindings: {
    LLM_PROVIDER: 'google';
    MODEL_NAME: string;
    API_KEY: string;
  };
};

const app = new Hono<Env>();
app.use(contextStorage());

app.get('/api/search', async (c) => {
  const query = c.req.query('query');

  if (!query) {
    return c.json({ error: 'Missing query parameter' }, 400);
  }

  try {
    // LLMを使用してクエリを構造化
    const model = createLLMModel().withStructuredOutput(SearchQueries);
    const promptText = createSearchPrompt(query);
    const structuredQueries = await model.invoke(promptText);

    // 各インスタンスの初期化
    await searchBrowser.initialize();
    await contentExtractor.initialize();

    // 構造化されたクエリを使用して検索を実行
    const searchResults = await searchBrowser.searchWithQueries(structuredQueries);

    // 検索結果からコンテンツを抽出
    const contentResults = await contentExtractor.extractContent(searchResults);

    return c.json(contentResults);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error processing query:', {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    // エラー発生時にはブラウザを再初期化
    await searchBrowser.close();
    await contentExtractor.close();

    return c.json({ error: errorMessage }, 500);
  }
});

export default app;
