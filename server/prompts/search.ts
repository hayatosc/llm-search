import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

export const SearchQuery = z.object({
  theme: z.string(),
  keywords: z.array(z.string()),
});

export const SearchQueries = z.object({
  searchThemes: SearchQuery.array(),
  searchConfig: z.object({
    lang: z.union([z.literal('en'), z.literal('ja'), z.literal('ko'), z.literal('zh')]),
    instruction: z.string(),
  }),
});

export const createSearchPrompt = (prompt: string) => {
  return [
    new SystemMessage(`You are an search agent conducting what users are searching for.

    Please keep following this instruction to define the search query step-by-step.
  
    Method:
    1. Seprate the user question into some sub-themes. Sub-themes are needed at least 3.
    2. Explain what each sub-theme is consisted of the user question.
    3. Propose some keywords for each sub-theme.
    4. Provide the search instruction for the next AI agent.

    Output example:
    {
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
      }
    }

    Points:
    - Your return should be just an JSON object with the above structure.
    - Please think what langauge is most suitable for the search. If the user question is about Japanese polotics, Japanese sources are valuable.
      - Available languages: 'en', 'ja', 'ko', 'zh'
    `),
    new HumanMessage(prompt),
  ];
};
