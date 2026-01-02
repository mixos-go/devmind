/**
 * DevMind Knowledge - Semantic Search Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticSearchEngine, SearchResult } from '../search';

describe('Semantic Search Engine', () => {
  let engine: SemanticSearchEngine;
  
  beforeEach(() => {
    engine = new SemanticSearchEngine();
  });

  describe('Basic search', () => {
    beforeEach(() => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'Python is a programming language used for web development and machine learning.',
          metadata: { title: 'Python Basics' },
        },
        {
          id: 'doc2',
          content: 'JavaScript is used for frontend development and building interactive web applications.',
          metadata: { title: 'JavaScript Guide' },
        },
        {
          id: 'doc3',
          content: 'Machine learning models can predict future outcomes using historical data.',
          metadata: { title: 'ML Fundamentals' },
        },
      ]);
    });

    it('should find relevant documents', () => {
      const results = engine.search('programming language', 3);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].documentId).toBe('doc1');
    });

    it('should rank by relevance', () => {
      const results = engine.search('web development', 3);
      
      expect(results.length).toBeGreaterThan(0);
      // Both doc1 and doc2 mention web, but doc2 is more relevant
      const scoreDoc2 = results.find(r => r.documentId === 'doc2')?.score || 0;
      const scoreDoc1 = results.find(r => r.documentId === 'doc1')?.score || 0;
      expect(scoreDoc2).toBeGreaterThanOrEqual(scoreDoc1);
    });

    it('should handle empty query', () => {
      const results = engine.search('', 3);
      expect(results).toHaveLength(0);
    });

    it('should respect topK parameter', () => {
      const results1 = engine.search('language', 1);
      const results2 = engine.search('language', 2);
      
      expect(results1.length).toBeLessThanOrEqual(1);
      expect(results2.length).toBeLessThanOrEqual(2);
    });

    it('should include document titles in results', () => {
      const results = engine.search('Python', 1);
      
      expect(results[0]).toHaveProperty('title');
      expect(results[0].title).toBe('Python Basics');
    });
  });

  describe('TF-IDF scoring', () => {
    beforeEach(() => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'data data data science analytics insights',
          metadata: {},
        },
        {
          id: 'doc2',
          content: 'machine learning models predictions',
          metadata: {},
        },
        {
          id: 'doc3',
          content: 'data visualization charts graphs',
          metadata: {},
        },
      ]);
    });

    it('should weight term frequency', () => {
      const results = engine.search('data', 3);
      
      // doc1 and doc3 both have 'data', but doc1 has it more frequently
      const doc1 = results.find(r => r.documentId === 'doc1');
      const doc3 = results.find(r => r.documentId === 'doc3');
      
      expect(doc1).toBeDefined();
      expect(doc3).toBeDefined();
      expect(doc1!.score).toBeGreaterThan(doc3!.score);
    });

    it('should reduce common terms weight', () => {
      engine.addDocuments([
        {
          id: 'doc4',
          content: 'analysis method approach technique system structure',
          metadata: {},
        },
      ]);

      const results = engine.search('structure', 3);
      const doc4Result = results.find(r => r.documentId === 'doc4');
      
      expect(doc4Result).toBeDefined();
    });
  });

  describe('Stop words', () => {
    beforeEach(() => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'the quick brown fox',
          metadata: {},
        },
        {
          id: 'doc2',
          content: 'quick fox running',
          metadata: {},
        },
      ]);
    });

    it('should filter stop words from query', () => {
      const results = engine.search('the quick', 2);
      
      // Should match 'quick' in both, 'the' is ignored
      expect(results.length).toBeGreaterThan(0);
    });

    it('should only match non-stop words', () => {
      // "the" is a stop word, should not match
      const results = engine.search('the', 2);
      
      // Stop words alone should return no results
      expect(results.length).toBe(0);
    });
  });

  describe('Similarity search', () => {
    beforeEach(() => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'Python programming language backend development',
          metadata: { title: 'Python' },
        },
        {
          id: 'doc2',
          content: 'Python tutorials examples learning',
          metadata: { title: 'Python Learn' },
        },
        {
          id: 'doc3',
          content: 'JavaScript frontend development web applications',
          metadata: { title: 'JavaScript' },
        },
      ]);
    });

    it('should find similar documents', () => {
      const results = engine.findSimilar('doc1', 2);
      
      expect(results.length).toBeGreaterThan(0);
      // doc2 should be more similar to doc1 than doc3
      expect(results[0].documentId).toBe('doc2');
    });

    it('should not return the query document', () => {
      const results = engine.findSimilar('doc1', 3);
      
      const ids = results.map(r => r.documentId);
      expect(ids).not.toContain('doc1');
    });
  });

  describe('Batch search', () => {
    beforeEach(() => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'Python programming',
          metadata: {},
        },
        {
          id: 'doc2',
          content: 'JavaScript coding',
          metadata: {},
        },
      ]);
    });

    it('should search multiple queries', () => {
      const results = engine.searchBatch(['Python', 'JavaScript'], 2);
      
      expect(results.has('Python')).toBe(true);
      expect(results.has('JavaScript')).toBe(true);
      expect(results.get('Python')![0].documentId).toBe('doc1');
      expect(results.get('JavaScript')![0].documentId).toBe('doc2');
    });
  });

  describe('Statistics', () => {
    it('should track corpus statistics', () => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'hello world test',
          metadata: {},
        },
        {
          id: 'doc2',
          content: 'another test document',
          metadata: {},
        },
      ]);

      const stats = engine.getStats();
      
      expect(stats.corpusSize).toBe(2);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.uniqueTokens).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long documents', () => {
      const longContent = Array(1000).fill('word').join(' ');
      engine.addDocuments([
        {
          id: 'long_doc',
          content: longContent,
          metadata: {},
        },
      ]);

      const results = engine.search('word', 1);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'Hello, world! Test@123 #hashtag',
          metadata: {},
        },
      ]);

      const results = engine.search('hello world test', 1);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle case insensitivity', () => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'Python Programming',
          metadata: {},
        },
      ]);

      const results1 = engine.search('python', 1);
      const results2 = engine.search('PYTHON', 1);
      
      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
    });

    it('should handle multiple spaces', () => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'hello    world    test',
          metadata: {},
        },
      ]);

      const results = engine.search('hello world', 1);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should clear index properly', () => {
      engine.addDocuments([
        {
          id: 'doc1',
          content: 'test content',
          metadata: {},
        },
      ]);

      engine.clear();
      const results = engine.search('test', 1);
      
      expect(results).toHaveLength(0);
    });
  });
});
