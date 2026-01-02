import { test, expect } from 'vitest';
import { buildIndex, simpleSearch } from '../search';

test('simpleSearch returns relevant docs by token match', () => {
  const docs = [
    { id: '1', content: 'This is a test document about JavaScript and Node.' },
    { id: '2', content: 'Another doc about Python and data science.' },
    { id: '3', content: 'Notes on Node, WebContainer, and servers.' },
  ];

  const idx = buildIndex(docs);
  const results = simpleSearch(idx, 'Node server');

  expect(results.length).toBeGreaterThan(0);
  expect(results[0].id).toBeDefined();
});
