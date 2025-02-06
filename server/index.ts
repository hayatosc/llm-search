import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';

import { createGeminiModel } from './llms/gemini';
import { createSearchPrompt, SearchQueries } from './prompts/search';

export type Env = {
  Bindings: {
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
    const model = createGeminiModel().withStructuredOutput(SearchQueries);
    const promptText = createSearchPrompt(query);
    const response = await model.invoke(promptText);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error processing query:', {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    return c.json({ error: errorMessage }, 500);
  }
});

export default app;
