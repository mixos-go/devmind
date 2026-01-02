import { test, expect } from 'vitest';
import { StreamProcessor } from '../utils/streaming';

test('StreamProcessor accumulates text and tool calls', () => {
  const called: any[] = [];
  const sp = new StreamProcessor({
    onText: (t) => called.push(['text', t]),
    onToolCall: (tc) => called.push(['tool', tc]),
    onUsage: (u) => called.push(['usage', u]),
  } as any);

  sp.processChunk({ type: 'text', content: 'Hello' } as any);
  sp.processChunk({ type: 'thinking', content: 'thinking...' } as any);
  sp.processChunk({ type: 'tool_call', toolCall: { id: '1', name: 'echo', arguments: { text: 'x' } } as any } as any);
  sp.processChunk({ type: 'usage', usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 } as any } as any);
  sp.processChunk({ type: 'done' } as any);

  expect(sp.getText()).toContain('Hello');
  const tools = sp.getToolCalls();
  expect(tools.length).toBeGreaterThanOrEqual(1);
  expect(sp.getUsage()?.totalTokens).toBe(3);
});
