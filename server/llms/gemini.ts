import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from 'hono/adapter';
import { getContext } from 'hono/context-storage';
import type { Env } from '../index';

export function createGeminiModel() {
  const context = getContext<Env>();
  const { MODEL_NAME, API_KEY } = env<Env['Bindings']>(context);

  return new ChatGoogleGenerativeAI({
    modelName: MODEL_NAME,
    maxOutputTokens: 4096,
    temperature: 0.5,
    apiKey: API_KEY,
    streaming: true,
  });
}
