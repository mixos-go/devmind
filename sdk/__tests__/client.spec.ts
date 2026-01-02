import { test, expect } from 'vitest';
import { createClient, LLMClient } from '../client';

test('LLMClient constructs with config', () => {
  const config: any = {
    defaultProvider: 'gemini',
    providers: [
      { name: 'gemini', apiKey: 'x' },
    ],
  };

  const client = createClient(config as any);
  expect(client).toBeInstanceOf(LLMClient);
  expect(client.getAvailableProviders()).toContain('gemini');
});
