/**
 * DevMind Knowledge - Markdown Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../markdownParser';

describe('Markdown Parser', () => {
  describe('Frontmatter parsing', () => {
    it('should extract YAML frontmatter', () => {
      const content = `---
title: Test Document
author: John Doe
version: 1
published: true
---
# Content here`;

      const result = parseMarkdown(content);

      expect(result.frontmatter).toEqual({
        title: 'Test Document',
        author: 'John Doe',
        version: 1,
        published: true,
      });
    });

    it('should handle missing frontmatter', () => {
      const content = '# No frontmatter\nJust content';
      const result = parseMarkdown(content);

      expect(result.frontmatter).toEqual({});
      expect(result.headings).toHaveLength(1);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
# Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter).toEqual({});
    });
  });

  describe('Heading extraction', () => {
    it('should extract headings with levels', () => {
      const content = `# Level 1
## Level 2
### Level 3`;

      const result = parseMarkdown(content);

      expect(result.headings).toHaveLength(3);
      expect(result.headings[0]).toEqual({ level: 1, text: 'Level 1', line: 0 });
      expect(result.headings[1]).toEqual({ level: 2, text: 'Level 2', line: 1 });
      expect(result.headings[2]).toEqual({ level: 3, text: 'Level 3', line: 2 });
    });

    it('should preserve heading text formatting', () => {
      const content = `# Heading with **bold** and *italic*
## Code \`snippet\` here`;

      const result = parseMarkdown(content);

      expect(result.headings[0].text).toBe('Heading with **bold** and *italic*');
      expect(result.headings[1].text).toBe('Code `snippet` here');
    });
  });

  describe('Code block extraction', () => {
    it('should extract code blocks with language', () => {
      const content = `
\`\`\`typescript
const x = 42;
\`\`\`

Some text

\`\`\`python
def hello():
    print("world")
\`\`\`
`;

      const result = parseMarkdown(content);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks[0]).toEqual({
        language: 'typescript',
        code: 'const x = 42;',
        startLine: expect.any(Number),
      });
      expect(result.codeBlocks[1]).toEqual({
        language: 'python',
        code: 'def hello():\n    print("world")',
        startLine: expect.any(Number),
      });
    });

    it('should handle code blocks without language', () => {
      const content = `
\`\`\`
plain text code
\`\`\`
`;

      const result = parseMarkdown(content);

      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBe('');
      expect(result.codeBlocks[0].code).toBe('plain text code');
    });
  });

  describe('Section hierarchies', () => {
    it('should build hierarchical sections', () => {
      const content = `# Main
Content 1

## Sub 1.1
Content 1.1

## Sub 1.2
Content 1.2

# Main 2
Content 2`;

      const result = parseMarkdown(content);

      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].heading?.text).toBe('Main');
      expect(result.sections[0].subsections).toHaveLength(2);
      expect(result.sections[0].subsections[0].heading?.text).toBe('Sub 1.1');
    });

    it('should capture section content', () => {
      const content = `# Section
This is the content
with multiple lines

## Subsection
More content`;

      const result = parseMarkdown(content);

      expect(result.sections[0].content).toContain('This is the content');
      expect(result.sections[0].subsections[0].content).toContain('More content');
    });

    it('should extract code blocks within sections', () => {
      const content = `# Section
\`\`\`js
const x = 1;
\`\`\``;

      const result = parseMarkdown(content);

      expect(result.sections[0].codeBlocks).toHaveLength(1);
      expect(result.sections[0].codeBlocks[0].language).toBe('js');
    });
  });

  describe('Complete document parsing', () => {
    it('should parse complex markdown document', () => {
      const content = `---
title: Complex Document
tags: test, markdown
---

# Main Section

This is an introduction with some text.

## Implementation

Here's how to implement:

\`\`\`typescript
export function example() {
  return "result";
}
\`\`\`

## Best Practices

- Point 1
- Point 2

### Deep Section

More content here.`;

      const result = parseMarkdown(content);

      // Check frontmatter
      expect(result.frontmatter.title).toBe('Complex Document');

      // Check headings
      expect(result.headings).toHaveLength(4);

      // Check code blocks
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].language).toBe('typescript');

      // Check sections
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].subsections).toHaveLength(2);
      expect(result.sections[0].subsections[1].subsections).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle inline code blocks', () => {
      const content = 'Use `inline code` here and `more code`.';
      const result = parseMarkdown(content);

      // Inline code should not be extracted as code blocks
      expect(result.codeBlocks).toHaveLength(0);
    });

    it('should handle unclosed code blocks gracefully', () => {
      const content = `Some content
\`\`\`javascript
const x = 1;`;

      const result = parseMarkdown(content);

      // Unclosed block should be ignored
      expect(result.codeBlocks).toHaveLength(0);
    });

    it('should handle multiple consecutive blank lines', () => {
      const content = `# Heading


Some content



More content`;

      const result = parseMarkdown(content);

      expect(result.headings).toHaveLength(1);
    });

    it('should handle special characters in content', () => {
      const content = `# Heading with special chars: $, %, @, #
Content with [links](http://example.com) and **formatting**`;

      const result = parseMarkdown(content);

      expect(result.headings[0].text).toContain('$, %, @, #');
    });
  });
});
