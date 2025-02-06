import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

import { env } from 'hono/adapter';
import { getContext } from 'hono/context-storage';

const { API_KEY } = env<{ API_KEY: string }>(getContext());

export const geminiModel = new ChatGoogleGenerativeAI({
  modelName: 'gemini-2.0-flash',
  maxOutputTokens: 2048,
  temperature: 0.5,
  apiKey: API_KEY,
  streaming: true,
});
