import { test, expect } from 'vitest';
import { LLMClient } from '../client';

test('LLMClient.executeTools runs tool execute functions and returns results', async () => {
  const client: any = {
    // use executeTools implementation directly
  };

  const { executeTools } = await import('../client') as any;

  const response = {
    toolCalls: [
      { id: 't1', name: 'echo', arguments: { text: 'hello' } },
    ],
  } as any;

  const tools = [
    {
      name: 'echo',
      execute: async (args: Record<string, unknown>) => `Echo: ${String(args.text || '')}`,
    },
  ];

  // Call the module-level exported function executeTools via LLMClient prototype
  const llm = new LLMClient({ defaultProvider: 'gemini', providers: [{ name: 'gemini', apiKey: 'x' }] } as any);
  const results = await llm.executeTools(response as any, tools as any);

  expect(results.length).toBe(1);
  expect(results[0].result).toBe('Echo: hello');
});
