import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

export const SearchQuery = z.object({
  theme: z.string(),
  keywords: z.array(z.string()),
});

export const SearchQueries = z.object({
  searchThemes: SearchQuery.array(),
  searchInstructions: z.string(),
});

export const createSearchPrompt = (prompt: string) => {
  return [
    new SystemMessage(`You are an search agent conducting what users are searching for.

    Please keep following this instruction to define the search query step-by-step.
  
    Method:
    1. Seprate the user question into some sub-themes.
    2. Explain what each sub-theme is consisted of the user question.
    3. Propose some keywords for each sub-theme.

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
      ],
      searchInstructions: 'Search in English. Use the keywords to find the most relevant information.'
    }

    Points:
    - Your return should be an object with the above structure.
    - Please think what langauge is most suitable for the search. If the user question is about Japanese polotics, Japanese sources are valuable.
    `),
    new HumanMessage(prompt),
  ];
};
