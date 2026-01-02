/**
 * DevMind Multi-Provider LLM SDK - Streaming Utilities
 */

import { StreamChunk, StreamOptions, ToolCall, TokenUsage } from '../types';

// ============================================
// STREAM PROCESSOR
// ============================================

export class StreamProcessor {
  private textBuffer = '';
  private toolCallBuffer: Map<string, Partial<ToolCall>> = new Map();
  private thinkingBuffer = '';
  private usage: TokenUsage | null = null;

  constructor(private readonly options?: StreamOptions) {}

  processChunk(chunk: StreamChunk): void {
    switch (chunk.type) {
      case 'text':
        if (chunk.content) {
          this.textBuffer += chunk.content;
          this.options?.onText?.(chunk.content);
        }
        break;

      case 'tool_call':
        if (chunk.toolCall) {
          this.processToolCallChunk(chunk.toolCall);
        }
        break;

      case 'thinking':
        if (chunk.content) {
          this.thinkingBuffer += chunk.content;
          this.options?.onThinking?.(chunk.content);
        }
        break;

      case 'usage':
        if (chunk.usage) {
          this.usage = chunk.usage;
          this.options?.onUsage?.(chunk.usage);
        }
        break;

      case 'error':
        if (chunk.error) {
          this.options?.onError?.(new Error(chunk.error));
        }
        break;

      case 'done':
        // Finalize any pending tool calls
        this.finalizeToolCalls();
        break;
    }
  }

  private processToolCallChunk(partial: Partial<ToolCall>): void {
    if (!partial.id) return;

    const existing = this.toolCallBuffer.get(partial.id) || {};
    
    const updated: Partial<ToolCall> = {
      ...existing,
      ...partial,
    };

    // Merge arguments if both exist
    if (existing.arguments && partial.arguments) {
      updated.arguments = {
        ...existing.arguments,
        ...partial.arguments,
      };
    }

    this.toolCallBuffer.set(partial.id, updated);
  }

  private finalizeToolCalls(): void {
    for (const [id, partial] of this.toolCallBuffer) {
      if (partial.name && partial.arguments) {
        const toolCall: ToolCall = {
          id,
          name: partial.name,
          arguments: partial.arguments,
        };
        this.options?.onToolCall?.(toolCall);
      }
    }
  }

  getText(): string {
    return this.textBuffer;
  }

  getToolCalls(): ToolCall[] {
    const calls: ToolCall[] = [];
    for (const [id, partial] of this.toolCallBuffer) {
      if (partial.name && partial.arguments) {
        calls.push({
          id,
          name: partial.name,
          arguments: partial.arguments,
        });
      }
    }
    return calls;
  }

  getThinking(): string {
    return this.thinkingBuffer;
  }

  getUsage(): TokenUsage | null {
    return this.usage;
  }

  reset(): void {
    this.textBuffer = '';
    this.toolCallBuffer.clear();
    this.thinkingBuffer = '';
    this.usage = null;
  }
}

// ============================================
// ASYNC ITERATOR HELPERS
// ============================================

export async function* mergeStreams<T>(
  ...streams: AsyncGenerator<T>[]
): AsyncGenerator<T> {
  const iterators = streams.map(s => s[Symbol.asyncIterator]());
  const pending = new Map<number, Promise<{ index: number; result: IteratorResult<T> }>>();

  // Initialize all iterators
  for (let i = 0; i < iterators.length; i++) {
    pending.set(i, iterators[i].next().then(result => ({ index: i, result })));
  }

  while (pending.size > 0) {
    const { index, result } = await Promise.race(pending.values());

    if (result.done) {
      pending.delete(index);
    } else {
      yield result.value;
      pending.set(index, iterators[index].next().then(r => ({ index, result: r })));
    }
  }
}

export async function collectStream<T>(stream: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of stream) {
    results.push(item);
  }
  return results;
}

export async function* mapStream<T, U>(
  stream: AsyncGenerator<T>,
  fn: (item: T) => U
): AsyncGenerator<U> {
  for await (const item of stream) {
    yield fn(item);
  }
}

export async function* filterStream<T>(
  stream: AsyncGenerator<T>,
  predicate: (item: T) => boolean
): AsyncGenerator<T> {
  for await (const item of stream) {
    if (predicate(item)) {
      yield item;
    }
  }
}

// ============================================
// TEXT STREAM HELPERS
// ============================================

export async function* textChunksToStream(
  chunks: AsyncGenerator<StreamChunk>
): AsyncGenerator<string> {
  for await (const chunk of chunks) {
    if (chunk.type === 'text' && chunk.content) {
      yield chunk.content;
    }
  }
}

export async function streamToText(
  stream: AsyncGenerator<StreamChunk>
): Promise<string> {
  let text = '';
  for await (const chunk of stream) {
    if (chunk.type === 'text' && chunk.content) {
      text += chunk.content;
    }
  }
  return text;
}

// ============================================
// SSE PARSER
// ============================================

export async function* parseSSE(
  response: Response
): AsyncGenerator<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  // Accumulate lines for a single SSE event (events are separated by a blank line)
  let eventLines: string[] = [];

  const flushEvent = async function*(lines: string[]): AsyncGenerator<Record<string, unknown>> {
    if (lines.length === 0) return;

    // Collect all `data:` lines and join with "\n" per SSE spec
    const dataLines: string[] = [];
    for (const l of lines) {
      if (l.startsWith('data:')) {
        dataLines.push(l.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) return;

    const data = dataLines.join('\n');
    if (!data) return;

    if (data === '[DONE]') {
      return;
    }

    try {
      yield JSON.parse(data);
    } catch {
      // Skip invalid JSON but don't crash the stream
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // process any remaining buffered text as final event(s)
        if (buffer.length > 0) {
          const remainingLines = buffer.split('\n');
          for (const rl of remainingLines) {
            const line = rl.replace(/\r$/, '');
            if (line === '') {
              for await (const ev of flushEvent(eventLines)) {
                yield ev;
              }
              eventLines = [];
            } else if (line.length > 0) {
              eventLines.push(line);
            }
          }
        }

        // Emit any remaining buffered event
        if (eventLines.length > 0) {
          for await (const ev of flushEvent(eventLines)) {
            yield ev;
          }
          eventLines = [];
        }

        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // keep the last partial line in buffer
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');

        // Blank line indicates end of an event
        if (line === '') {
          for await (const ev of flushEvent(eventLines)) {
            yield ev;
          }
          eventLines = [];
          continue;
        }

        // Skip comment lines (starting with ':') and accumulate data lines
        if (!line.startsWith(':')) {
          eventLines.push(line);
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

// ============================================
// NDJSON PARSER
// ============================================

export async function* parseNDJSON(
  response: Response
): AsyncGenerator<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Process remaining buffer
        if (buffer.trim()) {
          try {
            yield JSON.parse(buffer);
          } catch {
            // Skip invalid JSON
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            yield JSON.parse(line);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
