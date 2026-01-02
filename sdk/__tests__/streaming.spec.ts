/**
 * DevMind SDK - Streaming Parser Tests
 * Tests for SSE and NDJSON parsing with edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseSSE, parseNDJSON } from '../utils/streaming';

describe('SSE Parser', () => {
  describe('Basic parsing', () => {
    it('should parse simple SSE events', async () => {
      const sseText = `data: {"type":"text","content":"Hello"}
data: {"type":"done"}`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'text', content: 'Hello' });
      expect(events[1]).toEqual({ type: 'done' });
    });

    it('should parse events separated by blank lines', async () => {
      const sseText = `data: {"message":"first"}

data: {"message":"second"}
`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ message: 'first' });
      expect(events[1]).toEqual({ message: 'second' });
    });
  });

  describe('Multi-line data fields', () => {
    it('should parse multi-line data fields (SSE spec)', async () => {
      const sseText = `data: {"long":"value
data: that spans
data: multiple lines"}`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      // Multi-line data should be joined with newlines
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        long: 'value\nthat spans\nmultiple lines',
      });
    });
  });

  describe('Partial chunks', () => {
    it('should handle JSON split across chunks', async () => {
      const chunk1 = 'data: {"type":"te';
      const chunk2 = 'xt","content":"Hello"}';

      const readable = new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode(chunk1));
          await new Promise(r => setTimeout(r, 10));
          controller.enqueue(new TextEncoder().encode(chunk2));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'text', content: 'Hello' });
    });

    it('should handle line split across chunks', async () => {
      const chunk1 = 'data: {"msg"';
      const chunk2 = ':"test"}\n\ndata: {"msg":"next"}';

      const readable = new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode(chunk1));
          await new Promise(r => setTimeout(r, 10));
          controller.enqueue(new TextEncoder().encode(chunk2));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
    });
  });

  describe('Special cases', () => {
    it('should skip [DONE] marker', async () => {
      const sseText = `data: {"type":"text"}
data: [DONE]`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      // [DONE] should cause early return
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'text' });
    });

    it('should skip invalid JSON', async () => {
      const sseText = `data: {"valid":"json"}
data: {invalid json}
data: {"valid":true}`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      // Invalid JSON should be skipped, not crash
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ valid: 'json' });
      expect(events[1]).toEqual({ valid: true });
    });

    it('should handle CRLF line endings', async () => {
      const sseText = `data: {"line":"crlf"}\r\n\r\ndata: {"next":true}\r\n`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
    });

    it('should handle empty lines and comments', async () => {
      const sseText = `data: {"msg":"1"}

:comment line
data: {"msg":"2"}


data: {"msg":"3"}`;

      const readable = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sseText));
          controller.close();
        },
      });

      const response = new Response(readable);
      const events: Record<string, unknown>[] = [];

      for await (const event of parseSSE(response)) {
        events.push(event);
      }

      // Comments and empty lines should be ignored, yielding only valid data
      expect(events).toHaveLength(3);
    });
  });
});

describe('NDJSON Parser', () => {
  it('should parse newline-delimited JSON', async () => {
    const ndjsonText = `{"id":1,"msg":"first"}
{"id":2,"msg":"second"}
{"id":3,"msg":"third"}`;

    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ndjsonText));
        controller.close();
      },
    });

    const response = new Response(readable);
    const events: Record<string, unknown>[] = [];

    for await (const event of parseNDJSON(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ id: 1, msg: 'first' });
    expect(events[2]).toEqual({ id: 3, msg: 'third' });
  });

  it('should handle partial JSON across chunks', async () => {
    const chunk1 = '{"id":1,"msg":"';
    const chunk2 = 'test"}\n{"id":2,"msg":"done"}';

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(chunk1));
        await new Promise(r => setTimeout(r, 10));
        controller.enqueue(new TextEncoder().encode(chunk2));
        controller.close();
      },
    });

    const response = new Response(readable);
    const events: Record<string, unknown>[] = [];

    for await (const event of parseNDJSON(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
  });

  it('should skip invalid JSON lines', async () => {
    const ndjsonText = `{"valid":true}
{invalid json}
{"valid":false}`;

    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ndjsonText));
        controller.close();
      },
    });

    const response = new Response(readable);
    const events: Record<string, unknown>[] = [];

    for await (const event of parseNDJSON(response)) {
      events.push(event);
    }

    // Invalid line should be skipped
    expect(events).toHaveLength(2);
  });
});
