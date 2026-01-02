import { test, expect } from 'vitest';
import { AnthropicProvider } from '../providers/anthropic';

test('AnthropicProvider chat parses simple response', async () => {
  const originalFetch = (globalThis as any).fetch;
  try {
    const body = {
      content: [
        { type: 'text', text: 'Hello from Anthropic' },
      ],
      usage: { input_tokens: 1, output_tokens: 2 },
      model: 'claude-3-5-sonnet',
      stop_reason: 'end_turn',
    };

    (globalThis as any).fetch = async () => ({ ok: true, json: async () => body } as Response);

    const provider = new AnthropicProvider({ name: 'anthropic', apiKey: 'test' } as any);
    const resp = await provider.chat({ messages: [{ role: 'user', content: 'hi' }] } as any);

    expect(resp.content).toContain('Hello from Anthropic');
    expect(resp.usage.totalTokens).toBeGreaterThan(0);
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});
