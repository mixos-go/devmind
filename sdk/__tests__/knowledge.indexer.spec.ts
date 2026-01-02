import { test, expect } from 'vitest';
import parseMarkdown from '../../knowledge/markdownParser';
import indexDocuments from '../../knowledge/indexer';

test('markdown parser extracts headings and indexer counts tokens', () => {
  const md = `# Title\n\nSome text here.\n\n## Subtitle\n\nMore text`;
  const parsed = parseMarkdown(md);
  expect(parsed.headings).toContain('Title');
  expect(parsed.headings).toContain('Subtitle');

  const docs = [{ id: '1', content: md }];
  const indexed = indexDocuments(docs as any);
  expect(indexed[0].id).toBe('1');
  expect(indexed[0].tokens).toBeGreaterThan(0);
});
