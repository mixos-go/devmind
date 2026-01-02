import { test, expect } from 'vitest';
import { OpenAIProvider } from '../providers/openai';

// Mock fetch to return streaming-like chunks
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

test('OpenAIProvider stream POC yields text chunks', async () => {
  const originalFetch = (globalThis as any).fetch;
  try {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" there"}}]}\n\n',
    ];
    (globalThis as any).fetch = async () => createMockResponse(chunks);

    const provider = new OpenAIProvider({ name: 'openai', apiKey: 'test' } as any);

    const out: string[] = [];
    for await (const chunk of provider.stream({ messages: [{ role: 'user', content: 'hello' }], model: 'gpt-4o' } as any)) {
      if (chunk.type === 'text' && chunk.content) out.push(chunk.content);
      if (chunk.type === 'done') break;
    }

    expect(out.join('')).toBe('Hi there');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});
