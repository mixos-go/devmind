import { FileNode } from '../types';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const parsePath = (path: string): string[] => 
  path.split('/').filter(p => p && p !== '.');

const cloneNode = (node: FileNode): FileNode => 
  JSON.parse(JSON.stringify(node));

// ============================================
// FILE SYSTEM OPERATIONS
// ============================================

export const findNode = (root: FileNode, path: string): FileNode | null => {
  const parts = parsePath(path);
  let current = root;

  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) return null;
    const found = current.children.find(c => c.name === part);
    if (!found) return null;
    current = found;
  }
  
  return current;
};

export const writeFileNode = (root: FileNode, path: string, content: string): FileNode => {
  const parts = parsePath(path);
  const fileName = parts.pop();
  if (!fileName) return root;

  const newRoot = cloneNode(root);
  let current = newRoot;

  // Create directories as needed
  for (const part of parts) {
    if (current.type !== 'directory') {
      throw new Error(`Path ${part} is not a directory`);
    }
    current.children ??= [];

    let next = current.children.find(c => c.name === part);
    if (!next) {
      next = { name: part, type: 'directory', children: [] };
      current.children.push(next);
    }
    current = next;
  }

  // Write or update file
  current.children ??= [];
  const existingFile = current.children.find(c => c.name === fileName);
  
  if (existingFile) {
    existingFile.content = content;
    existingFile.type = 'file';
  } else {
    current.children.push({ name: fileName, type: 'file', content });
  }

  return newRoot;
};

export const readFileNode = (root: FileNode, path: string): string => {
  const node = findNode(root, path);
  
  if (!node) return `Error: File '${path}' not found.`;
  if (node.type === 'directory') return `Error: '${path}' is a directory.`;
  
  return node.content ?? '';
};

export const listDirNode = (root: FileNode, path: string): string => {
  const node = path === '/' || path === '' ? root : findNode(root, path);
  
  if (!node) return `Error: Path '${path}' not found.`;
  if (node.type !== 'directory') return `Error: '${path}' is not a directory.`;
  
  if (!node.children?.length) return '(empty)';
  
  return node.children
    .map(c => `${c.type === 'directory' ? '[DIR]' : '[FILE]'} ${c.name}`)
    .join('\n');
};

export const deleteNode = (root: FileNode, path: string): FileNode => {
  const parts = parsePath(path);
  const targetName = parts.pop();
  if (!targetName) return root;

  const newRoot = cloneNode(root);
  let current = newRoot;

  // Navigate to parent directory
  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) return root;
    const next = current.children.find(c => c.name === part);
    if (!next) return root;
    current = next;
  }

  // Remove target
  if (current.children) {
    current.children = current.children.filter(c => c.name !== targetName);
  }

  return newRoot;
};
