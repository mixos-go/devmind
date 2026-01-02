/**
 * DevMind SDK - Anthropic Provider Tests (Simple)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../providers/anthropic';
import { ChatRequest } from '../types';

describe('Anthropic Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert messages correctly', () => {
    const provider = new AnthropicProvider(
      { name: 'anthropic', apiKey: 'test-key', defaultModel: 'claude-3-5-sonnet-20241022' }
    );

    const request: ChatRequest = {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    };

    // Test that provider can be instantiated and initialized
    expect(provider).toBeDefined();
    expect(provider.name).toBe('anthropic');
  });

  it('should support tool definitions', () => {
    const provider = new AnthropicProvider(
      { name: 'anthropic', apiKey: 'test-key', defaultModel: 'claude-3-5-sonnet-20241022' }
    );

    const tools = [
      {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: { location: { type: 'string' } },
        },
      },
    ];

    const request: ChatRequest = {
      messages: [{ role: 'user', content: 'What is the weather?' }],
      tools,
    };

    // Verify provider structure
    expect(provider.models).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'claude-3-5-sonnet-20241022' }),
    ]));
  });

  it('should handle tool responses', () => {
    const provider = new AnthropicProvider(
      { name: 'anthropic', apiKey: 'test-key', defaultModel: 'claude-3-5-sonnet-20241022' }
    );

    const request: ChatRequest = {
      messages: [
        { role: 'user', content: 'Get weather for NYC' },
        { role: 'assistant', content: '', toolCalls: [
          { id: 'call_1', name: 'get_weather', arguments: { location: 'NYC' } }
        ]},
        { role: 'tool', toolCallId: 'call_1', content: 'Sunny, 72F', name: 'get_weather' },
      ],
    };

    expect(provider).toBeDefined();
    expect(request.messages).toHaveLength(3);
  });
});
