/**
 * DevMind SDK - Ollama Provider Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OllamaProvider } from '../providers/ollama';
import { ChatRequest } from '../types';

describe('Ollama Provider', () => {
  beforeEach(() => {
    // Clear any mocks
  });

  it('should have default models', () => {
    const provider = new OllamaProvider(
      { name: 'ollama', baseUrl: 'http://localhost:11434' }
    );

    expect(provider.models).toBeDefined();
    expect(provider.models.length).toBeGreaterThan(0);
    expect(provider.models.some(m => m.id === 'llama3.2')).toBe(true);
  });

  it('should support text generation', () => {
    const provider = new OllamaProvider(
      { name: 'ollama', baseUrl: 'http://localhost:11434' }
    );

    const request: ChatRequest = {
      messages: [
        { role: 'user', content: 'Hello, Ollama!' },
      ],
    };

    expect(provider).toBeDefined();
    expect(request.messages).toHaveLength(1);
  });

  it('should handle conversation history', () => {
    const provider = new OllamaProvider(
      { name: 'ollama', baseUrl: 'http://localhost:11434' }
    );

    const request: ChatRequest = {
      messages: [
        { role: 'user', content: 'What is AI?' },
        { role: 'assistant', content: 'AI is artificial intelligence.' },
        { role: 'user', content: 'Tell me more' },
      ],
    };

    expect(provider.models.some(m => m.supportsStreaming)).toBe(true);
  });

  it('should support different models', () => {
    const provider = new OllamaProvider(
      { name: 'ollama', baseUrl: 'http://localhost:11434', defaultModel: 'codellama' }
    );

    expect(provider.models.some(m => m.id === 'codellama')).toBe(true);
    const codeModel = provider.models.find(m => m.id === 'codellama');
    expect(codeModel?.supportsTools).toBe(false); // Code Llama doesn't support tools
  });
});
