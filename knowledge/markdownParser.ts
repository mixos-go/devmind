/**
 * Markdown Parser for DevMind Knowledge Base
 * Extracts frontmatter, headings, code blocks, and sections
 */

export interface FrontMatter {
  [key: string]: unknown;
}

export interface CodeBlock {
  language: string;
  code: string;
  startLine: number;
}

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface MarkdownSection {
  heading: Heading | null;
  content: string;
  codeBlocks: CodeBlock[];
  subsections: MarkdownSection[];
}

export interface ParsedMarkdown {
  frontmatter: FrontMatter;
  content: string;
  headings: Heading[];
  codeBlocks: CodeBlock[];
  sections: MarkdownSection[];
  rawLines: string[];
}

/**
 * Extract YAML frontmatter from markdown
 */
function parseFrontMatter(content: string): { frontmatter: FrontMatter; remaining: string } {
  if (!content.startsWith('---')) {
    return { frontmatter: {}, remaining: content };
  }

  const lines = content.split('\n');
  const endIndex = lines.slice(1).findIndex(line => line.trim() === '---');

  if (endIndex === -1) {
    return { frontmatter: {}, remaining: content };
  }

  const frontmatterLines = lines.slice(1, endIndex + 1);
  const frontmatter: FrontMatter = {};

  for (const line of frontmatterLines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      // Simple YAML-like parsing (not full YAML parser)
      if (value === 'true') frontmatter[key.trim()] = true;
      else if (value === 'false') frontmatter[key.trim()] = false;
      else if (/^\d+$/.test(value)) frontmatter[key.trim()] = parseInt(value, 10);
      else frontmatter[key.trim()] = value;
    }
  }

  const remainingContent = lines.slice(endIndex + 2).join('\n');
  return { frontmatter, remaining: remainingContent };
}

/**
 * Extract code blocks from markdown
 */
function extractCodeBlocks(content: string): { codeBlocks: CodeBlock[]; lines: string[] } {
  const codeBlocks: CodeBlock[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let currentCode = '';
  let currentLanguage = '';
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        currentLanguage = line.slice(3).trim();
        startLine = i;
        currentCode = '';
      } else {
        inCodeBlock = false;
        codeBlocks.push({
          language: currentLanguage,
          code: currentCode.trimEnd(),
          startLine,
        });
      }
    } else if (inCodeBlock) {
      currentCode += line + '\n';
    }
  }

  return { codeBlocks, lines };
}

/**
 * Extract headings from markdown
 */
function extractHeadings(lines: string[]): Heading[] {
  const headings: Heading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.*)$/);

    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        line: i,
      });
    }
  }

  return headings;
}

/**
 * Build hierarchical sections from content
 */
function buildSections(headings: Heading[], lines: string[]): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const stack: MarkdownSection[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];
    const endLine = nextHeading ? nextHeading.line : lines.length;

    // Extract content between this heading and the next
    const contentLines = lines.slice(heading.line + 1, endLine);
    const content = contentLines.join('\n').trim();

    // Extract code blocks in this section
    const { codeBlocks } = extractCodeBlocks(content);

    const section: MarkdownSection = {
      heading,
      content,
      codeBlocks,
      subsections: [],
    };

    // Maintain hierarchy based on heading level
    while (stack.length > 0 && stack[stack.length - 1].heading!.level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      sections.push(section);
    } else {
      stack[stack.length - 1].subsections.push(section);
    }

    stack.push(section);
  }

  return sections;
}

/**
 * Parse markdown content completely
 */
export function parseMarkdown(content: string): ParsedMarkdown {
  // Extract frontmatter
  const { frontmatter, remaining } = parseFrontMatter(content);

  // Extract code blocks
  const { codeBlocks, lines } = extractCodeBlocks(remaining);

  // Extract headings
  const headings = extractHeadings(lines);

  // Build sections
  const sections = buildSections(headings, lines);

  // Get full content without code blocks for indexing
  let cleanContent = remaining;
  for (const block of codeBlocks) {
    cleanContent = cleanContent.replace(
      new RegExp(`\`\`\`${block.language}\n${block.code}\n\`\`\``, 'g'),
      `[code: ${block.language}]`
    );
  }

  return {
    frontmatter,
    content: cleanContent,
    headings,
    codeBlocks,
    sections,
    rawLines: lines,
  };
}

export default parseMarkdown;
