import { afterEach, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { ContentExtractor, type ContentResult } from './content-extractor';
import type { SearchResult } from './search';
import { SearchBrowser } from './search';

const TIMEOUT = 5 * 60 * 1000; // reCAPTCHA入力のためタイムアウト(5分)

describe('SearchBrowser', () => {
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

      console.dir(result, { depth: null });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expectTypeOf(result[0]).toEqualTypeOf<SearchResult>();
    },
    TIMEOUT
  );
});

const testSearchResults: SearchResult[] = [
  {
    theme: 'What is ChatGPT?',
    results: [
      {
        title: 'Introducing ChatGPT',
        snippet:
          '2022/11/30 — ChatGPT is a sibling model to InstructGPT⁠, which is trained to follow an instruction in a prompt and provide a detailed response.',
        link: 'https://openai.com/index/chatgpt/',
      },
      {
        title: 'ChatGPT',
        snippet:
          'ChatGPT helps you get answers, find inspiration and be more productive. It is free to use and easy to try. Just ask and ChatGPT can help with writing, ...',
        link: 'https://chatgpt.com/',
      },
      {
        title: 'ChatGPT on the App Store',
        snippet:
          'This official app is free, syncs your history across devices, and brings you the newest model improvements from OpenAI. With ChatGPT in your pocket ...',
        link: 'https://apps.apple.com/jp/app/chatgpt/id6448311069?l=en-US',
      },
      {
        title: 'OpenAI Stories | ChatGPT',
        snippet: '4 日前 — Explore how our network of customers is using our technology to advance their goals.',
        link: 'https://openai.com/stories/chatgpt/',
      },
      {
        title: 'LLMはどう知識を記憶しているか | Chapter 7, 深層学習',
        snippet:
          'この動画は3Blue1Brownの動画を東京大学の学生有志団体が翻訳・再編集し公式ライセンスのもと公開しているものです。 チャンネル登録と高評価を ...',
        link: 'https://www.youtube.com/watch?v=mmWuqh7XDx4',
      },
    ],
  },
  {
    theme: 'What ChatGPT can make changes for our lives?',
    results: [
      {
        title: 'How has ChatGPT changed our lives?',
        snippet:
          '2024/06/24 — ChatGPT enhances various industries, from automating customer support and facilitating medical documentation to creating storylines for movies ...',
        link: 'https://www.expressvpn.com/blog/how-has-chatgpt-changed-our-lives/?srsltid=AfmBOopw7SRquSQOmvAT_MUDucwwBy8RINYLnYIyTXgQW6zs7j_ZVN1p',
      },
      {
        title: 'ChatGPT Capabilities Overview',
        snippet:
          'Core Capabilities · Web Browsing · Image processing · Image generation · Text documents · Advanced Data Analysis · Voice. You can interact with ChatGPT by ...',
        link: 'https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview',
      },
      {
        title: 'ChatGPT - Apps on Google Play',
        snippet:
          'With the official ChatGPT app, get instant answers and inspiration wherever you are. This app is free and brings you the newest model improvements from ...',
        link: 'https://play.google.com/store/apps/details?id=com.openai.chatgpt',
      },
      {
        title: 'Use cases and examples',
        snippet: 'Share cool ChatGPT use cases and examples!',
        link: 'https://community.openai.com/c/chatgpt/use-cases-and-example/25',
      },
      {
        title: '50 ChatGPT Use Cases with Real-Life Examples in 2025',
        snippet: 'ChatGPT can be used to generate high-quality content for websites, blogs, or social media platforms in a few seconds.',
        link: 'https://research.aimultiple.com/chatgpt-use-cases/',
      },
    ],
  },
  {
    theme: 'How to use ChatGPT?',
    results: [
      {
        title: 'Introducing ChatGPT',
        snippet:
          '2022/11/30 — The dialogue format makes it possible for ChatGPT to answer followup questions, admit its mistakes, challenge incorrect premises, and reject ...',
        link: 'https://openai.com/index/chatgpt/',
      },
      {
        title: 'ChatGPT-3.5 Tutorial',
        snippet: 'In this tutorial you get step-by-step guides on how to write AI prompts to get the best possible results from ChatGPT-3.5.',
        link: 'https://www.w3schools.com/gen_ai/chatgpt-3-5/index.php',
      },
      {
        title: "How to use ChatGPT: A beginner's guide to getting started",
        snippet:
          'How to use the ChatGPT desktop app · Type your prompt in the message bar. You can also click the microphone icon to enter your prompt using voice-to-text.',
        link: 'https://zapier.com/blog/how-to-use-chatgpt/',
      },
      {
        title: 'Custom instructions for ChatGPT',
        snippet:
          "2023/07/20 — Custom instructions allow you to add preferences or requirements that you'd like ChatGPT to consider when generating its responses.",
        link: 'https://openai.com/index/custom-instructions-for-chatgpt/',
      },
      {
        title: 'Guide - ChatGPT',
        snippet: 'A creative guide for your projects and ideas. Sign up to chat. Sign up or Log in to chat.',
        link: 'https://chatgpt.com/g/g-KITZyD8QR-guide',
      },
    ],
  },
];

describe('ContentExtractor', () => {
  let extractor: ContentExtractor;

  beforeEach(async () => {
    extractor = new ContentExtractor();
    await extractor.initialize();
  });

  afterEach(async () => {
    await extractor.close();
  });

  it(
    'should extract content from search results',
    async () => {
      console.log('\n⚠️ reCAPTCHAが表示された場合は手動で入力してください。\n');

      const results = await extractor.extractContent(testSearchResults);

      console.dir(results, { depth: null });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(testSearchResults.length);
      expectTypeOf(results[0]).toEqualTypeOf<ContentResult>();
    },
    TIMEOUT
  );
});
