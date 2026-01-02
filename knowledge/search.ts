/**
 * DevMind Knowledge Base - Semantic Search
 * Implements TF-IDF and semantic similarity for document retrieval
 */

import { Document } from './KnowledgeBase';

// ============================================
// SEARCH INDEX TYPES
// ============================================

export interface SearchIndex {
  documentId: string;
  tokens: Map<string, number>; // token -> TF
  uniqueTokens: Set<string>;
  length: number;
}

export interface SearchResult {
  documentId: string;
  score: number;
  content: string;
  title?: string;
}

// ============================================
// TOKENIZATION & PREPROCESSING
// ============================================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'by', 'from', 'as', 'it', 'its', 'i', 'you', 'he', 'she', 'we', 'they'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(token => token.length > 0 && !STOP_WORDS.has(token));
}

function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const totalTokens = tokens.length;
  
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1 / totalTokens);
  }
  
  return tf;
}

// ============================================
// SEARCH ENGINE
// ============================================

export class SemanticSearchEngine {
  private indices: Map<string, SearchIndex> = new Map();
  private documentMap: Map<string, { content: string; title?: string }> = new Map();
  private idfCache: Map<string, number> = new Map();
  private corpusSize = 0;

  /**
   * Build or update search index for documents
   */
  addDocuments(documents: Document[]): void {
    for (const doc of documents) {
      const tokens = tokenize(doc.content);
      const tf = calculateTF(tokens);
      
      this.indices.set(doc.id, {
        documentId: doc.id,
        tokens: tf,
        uniqueTokens: new Set(tokens),
        length: tokens.length,
      });

      this.documentMap.set(doc.id, {
        content: doc.content.slice(0, 500), // Store first 500 chars for preview
        title: doc.metadata.title as string | undefined,
      });
    }

    this.corpusSize = this.indices.size;
    this.idfCache.clear(); // Invalidate IDF cache when corpus changes
  }

  /**
   * Calculate Inverse Document Frequency
   */
  private getIDF(token: string): number {
    if (this.idfCache.has(token)) {
      return this.idfCache.get(token)!;
    }

    let documentFrequency = 0;
    for (const index of this.indices.values()) {
      if (index.uniqueTokens.has(token)) {
        documentFrequency++;
      }
    }

    const idf = documentFrequency > 0 
      ? Math.log(this.corpusSize / documentFrequency)
      : 0;

    this.idfCache.set(token, idf);
    return idf;
  }

  /**
   * Calculate TF-IDF score between query and document
   */
  private calculateTFIDF(queryTokens: string[], docIndex: SearchIndex): number {
    let score = 0;

    for (const token of queryTokens) {
      const tf = docIndex.tokens.get(token) || 0;
      const idf = this.getIDF(token);
      score += tf * idf;
    }

    return score;
  }

  /**
   * Calculate cosine similarity between two token sets
   */
  private calculateCosineSimilarity(
    queryTokens: string[],
    docTokens: Set<string>
  ): number {
    let intersection = 0;
    for (const token of queryTokens) {
      if (docTokens.has(token)) {
        intersection++;
      }
    }

    const denominator = Math.sqrt(queryTokens.length * docTokens.size);
    return denominator > 0 ? intersection / denominator : 0;
  }

  /**
   * Search documents with BM25-like ranking
   */
  search(query: string, topK: number = 5): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const [docId, index] of this.indices) {
      // Calculate TF-IDF score
      const tfidfScore = this.calculateTFIDF(queryTokens, index);

      // Calculate cosine similarity for diversity
      const cosineSimilarity = this.calculateCosineSimilarity(
        queryTokens,
        index.uniqueTokens
      );

      // Combined score: weight TF-IDF more heavily
      const combinedScore = tfidfScore * 0.7 + cosineSimilarity * 0.3;

      if (combinedScore > 0) {
        const docInfo = this.documentMap.get(docId);
        results.push({
          documentId: docId,
          score: combinedScore,
          content: docInfo?.content || '',
          title: docInfo?.title,
        });
      }
    }

    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Batch search multiple queries
   */
  searchBatch(queries: string[], topK: number = 5): Map<string, SearchResult[]> {
    const results = new Map<string, SearchResult[]>();
    for (const query of queries) {
      results.set(query, this.search(query, topK));
    }
    return results;
  }

  /**
   * Find similar documents to a given document
   */
  findSimilar(documentId: string, topK: number = 5): SearchResult[] {
    const docIndex = this.indices.get(documentId);
    if (!docIndex) {
      return [];
    }

    const queryTokens = Array.from(docIndex.uniqueTokens);
    const results: SearchResult[] = [];

    for (const [otherId, otherIndex] of this.indices) {
      if (otherId === documentId) continue;

      const similarity = this.calculateCosineSimilarity(
        queryTokens,
        otherIndex.uniqueTokens
      );

      if (similarity > 0) {
        const docInfo = this.documentMap.get(otherId);
        results.push({
          documentId: otherId,
          score: similarity,
          content: docInfo?.content || '',
          title: docInfo?.title,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get search statistics
   */
  getStats(): { corpusSize: number; totalTokens: number; uniqueTokens: number } {
    let totalTokens = 0;
    const uniqueTokensSet = new Set<string>();

    for (const index of this.indices.values()) {
      totalTokens += index.length;
      for (const token of index.uniqueTokens) {
        uniqueTokensSet.add(token);
      }
    }

    return {
      corpusSize: this.corpusSize,
      totalTokens,
      uniqueTokens: uniqueTokensSet.size,
    };
  }

  /**
   * Clear all indices
   */
  clear(): void {
    this.indices.clear();
    this.documentMap.clear();
    this.idfCache.clear();
    this.corpusSize = 0;
  }
}

// ============================================
// LEGACY SIMPLE SEARCH (backward compatible)
// ============================================

type Doc = { id: string; content: string };

function buildIndex(docs: Doc[]) {
  return docs.map(d => ({ id: d.id, tokens: tokenize(d.content) }));
}

export function simpleSearch(index: ReturnType<typeof buildIndex>, query: string, topK = 3) {
  const q = tokenize(query);
  const scores = index.map(doc => {
    let score = 0;
    for (const t of q) {
      for (const dt of doc.tokens) if (dt === t) score++;
    }
    return { id: doc.id, score };
  });

  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
}

export default { SemanticSearchEngine, buildIndex, simpleSearch };
