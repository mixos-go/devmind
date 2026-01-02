import { test, expect } from 'vitest';
import { GeminiProvider } from '../providers/gemini';

// Minimal mock for fetch streaming SSE-like response
function createMockResponse(chunks: string[]) {
  let i = 0;
  return {
    ok: true,
    body: {
      getReader: () => ({
        async read() {
          if (i >= chunks.length) return { done: true, value: undefined };
          const chunk = new TextEncoder().encode(chunks[i++]);
          return { done: false, value: chunk };
        },
      }),
    },
  } as unknown as Response;
}

test('GeminiProvider stream POC yields text chunks', async () => {
  const originalFetch = (globalThis as any).fetch;

  try {
    const sseChunks = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}] }\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}] }\n\n',
    ];

    (globalThis as any).fetch = async () => createMockResponse(sseChunks);

    const provider = new GeminiProvider({ name: 'gemini', apiKey: 'test-key' } as any);

    const chunks: string[] = [];
    for await (const c of provider.stream({ messages: [{ role: 'user', content: 'hi' }], model: 'gemini-2.5-pro' } as any)) {
      if (c.type === 'text' && c.content) chunks.push(c.content);
      if (c.type === 'done') break;
    }

    expect(chunks.join('')).toBe('Hello world');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});
