import fs from 'fs';
import path from 'path';
import { KnowledgeBase, Document } from './KnowledgeBase';
import { parseMarkdown } from './markdownParser';

/**
 * Markdown loader with structured parsing
 * Extracts frontmatter, headings, sections, and code blocks
 */
export async function loadMarkdownFile(kb: KnowledgeBase, filePath: string, scope?: 'platform' | 'project'): Promise<Document> {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseMarkdown(content);

  // Create main document with parsed metadata
  const doc = kb.addMarkdown(parsed.content, filePath);
  
  if (scope) doc.metadata.scope = scope;
  
  // Flatten frontmatter into metadata for easy access
  if (Object.keys(parsed.frontmatter).length > 0) {
    Object.assign(doc.metadata, parsed.frontmatter);
    doc.metadata.frontmatter = parsed.frontmatter;
  }

  // Store headings for navigation
  if (parsed.headings.length > 0) {
    doc.metadata.headings = parsed.headings.map(h => ({
      level: h.level,
      text: h.text,
    }));
  }

  // Store code blocks for code search
  if (parsed.codeBlocks.length > 0) {
    doc.metadata.codeBlockLanguages = [...new Set(parsed.codeBlocks.map(b => b.language))];
  }

  return doc;
}

export async function loadMarkdownDir(kb: KnowledgeBase, dirPath: string, scope?: 'platform' | 'project'): Promise<void> {
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const full = path.join(dirPath, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      await loadMarkdownDir(kb, full, scope);
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      await loadMarkdownFile(kb, full, scope);
    }
  }
}
