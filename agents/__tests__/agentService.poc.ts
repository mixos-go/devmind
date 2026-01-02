import { test, expect } from 'vitest';
import { initAgentService, getAgentService } from '../AgentService';

test('AgentService sendMessage returns streamed text via onStream and final response', async () => {
  const originalFetch = (globalThis as any).fetch;
  try {
    // Mock Gemini provider chat endpoint
    (globalThis as any).fetch = async (url: string, opts?: any) => {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: 'Agent reply' }] } }
          ],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 }
        })
      } as Response;
    };

    initAgentService({ apiKey: 'test-key' } as any);
    const svc = getAgentService();

    let streamed = '';
    const result = await svc.sendMessage(
      [{ sender: 1, text: 'Hello', image: undefined } as any],
      {} as any,
      { id: 'p1', allowedTools: [], systemInstruction: 'You are helpful' } as any,
      async () => '',
      {
        onStream: (chunk: string) => { streamed += chunk; },
        onToolStart: () => {},
        onToolEnd: () => {},
        onThinking: () => {},
      }
    );

    expect(streamed).toContain('Agent reply');
    expect(result).toContain('Agent reply');
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
});
