import { test, expect } from 'vitest';
import { OllamaProvider } from '../providers/ollama';

test('OllamaProvider detects local model and responds', async () => {
  const originalFetch = (globalThis as any).fetch;
  try {
    // Simulate /models endpoint
    (globalThis as any).fetch = async (url: string, opts?: any) => {
      if (url.includes('/models')) {
        return { ok: true, json: async () => [{ name: 'llama3.2' }] } as Response;
      }
      // Chat endpoint
      return { ok: true, json: async () => ({ id: '1', model: 'llama3.2', content: 'local response' }) } as Response;
    };

    const provider = new OllamaProvider({ name: 'ollama', baseUrl: 'http://localhost:11434' } as any);
    const resp = await provider.chat({ messages: [{ role: 'user', content: 'hello' }] } as any);

    expect(resp.content).toContain('local response');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});
