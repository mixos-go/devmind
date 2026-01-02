import { AgentContext } from '../types';

// Extended context types for terminal/editor integration
export interface FileContext {
  path: string;
  content: string;
  language?: string;
  isDirty?: boolean;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
    text: string;
  };
}

export interface TerminalContext {
  history: string[];
  lastCommand?: string;
  lastOutput?: string;
  lastError?: string;
  workingDirectory: string;
  environment?: Record<string, string>;
}

export interface GitContext {
  branch?: string;
  status?: string;
  hasChanges?: boolean;
  stagedFiles?: string[];
  modifiedFiles?: string[];
  untrackedFiles?: string[];
  remoteUrl?: string;
}

export interface ProjectContext {
  name?: string;
  type?: 'node' | 'python' | 'rust' | 'go' | 'unknown';
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo';
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  rootPath?: string;
}

export interface ExtendedAgentContext extends AgentContext {
  file?: FileContext;
  terminal?: TerminalContext;
  git?: GitContext;
  project?: ProjectContext;
  timestamp?: number;
  sessionId?: string;
}

// Context collector class
export class ContextInjector {
  private fileContext: FileContext | null = null;
  private terminalContext: TerminalContext | null = null;
  private gitContext: GitContext | null = null;
  private projectContext: ProjectContext | null = null;
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session_${Date.now()}`;
  }

  // Set file context (from editor)
  setFileContext(context: FileContext | null): void {
    this.fileContext = context;
  }

  // Update file content
  updateFileContent(path: string, content: string): void {
    if (this.fileContext?.path === path) {
      this.fileContext.content = content;
      this.fileContext.isDirty = true;
    }
  }

  // Set selection
  setSelection(selection: FileContext['selection']): void {
    if (this.fileContext) {
      this.fileContext.selection = selection;
    }
  }

  // Set terminal context
  setTerminalContext(context: Partial<TerminalContext>): void {
    this.terminalContext = {
      history: context.history || this.terminalContext?.history || [],
      workingDirectory: context.workingDirectory || this.terminalContext?.workingDirectory || '/',
      lastCommand: context.lastCommand,
      lastOutput: context.lastOutput,
      lastError: context.lastError,
      environment: context.environment,
    };
  }

  // Add command to terminal history
  addToHistory(command: string, output?: string, error?: string): void {
    if (!this.terminalContext) {
      this.terminalContext = {
        history: [],
        workingDirectory: '/',
      };
    }
    
    this.terminalContext.history.push(command);
    // Keep last 100 commands
    if (this.terminalContext.history.length > 100) {
      this.terminalContext.history = this.terminalContext.history.slice(-100);
    }
    
    this.terminalContext.lastCommand = command;
    if (output) this.terminalContext.lastOutput = output;
    if (error) this.terminalContext.lastError = error;
  }

  // Set git context
  setGitContext(context: GitContext | null): void {
    this.gitContext = context;
  }

  // Set project context
  setProjectContext(context: ProjectContext | null): void {
    this.projectContext = context;
  }

  // Detect project type from package files
  async detectProjectType(readFile: (path: string) => Promise<string | null>): Promise<void> {
    try {
      // Check for package.json (Node.js)
      const packageJson = await readFile('package.json');
      if (packageJson) {
        const pkg = JSON.parse(packageJson);
        this.projectContext = {
          name: pkg.name,
          type: 'node',
          packageManager: 'npm', // Could detect yarn.lock, pnpm-lock.yaml
          dependencies: { ...pkg.dependencies, ...pkg.devDependencies },
          scripts: pkg.scripts,
        };
        return;
      }

      // Check for requirements.txt (Python)
      const requirements = await readFile('requirements.txt');
      if (requirements) {
        this.projectContext = {
          type: 'python',
          packageManager: 'pip',
        };
        return;
      }

      // Check for Cargo.toml (Rust)
      const cargoToml = await readFile('Cargo.toml');
      if (cargoToml) {
        this.projectContext = {
          type: 'rust',
          packageManager: 'cargo',
        };
        return;
      }

      // Check for go.mod (Go)
      const goMod = await readFile('go.mod');
      if (goMod) {
        this.projectContext = {
          type: 'go',
        };
        return;
      }

      this.projectContext = { type: 'unknown' };
    } catch {
      this.projectContext = { type: 'unknown' };
    }
  }

  // Collect full context
  collectContext(overrides?: Partial<ExtendedAgentContext>): ExtendedAgentContext {
    const base: ExtendedAgentContext = {
      currentDirectory: this.terminalContext?.workingDirectory || overrides?.currentDirectory || '/',
      openFiles: this.fileContext ? [this.fileContext.path] : overrides?.openFiles || [],
      lastOutput: this.terminalContext?.lastOutput || overrides?.lastOutput || '',
      lastError: this.terminalContext?.lastError || overrides?.lastError,
      gitStatus: this.gitContext?.status || overrides?.gitStatus,
      runningProcesses: overrides?.runningProcesses || [],
      file: this.fileContext || undefined,
      terminal: this.terminalContext || undefined,
      git: this.gitContext || undefined,
      project: this.projectContext || undefined,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    return { ...base, ...overrides };
  }

  // Build context string for AI prompt
  buildContextString(options?: {
    includeFile?: boolean;
    includeTerminal?: boolean;
    includeGit?: boolean;
    includeProject?: boolean;
    maxFileLength?: number;
    maxHistoryLength?: number;
  }): string {
    const {
      includeFile = true,
      includeTerminal = true,
      includeGit = true,
      includeProject = true,
      maxFileLength = 3000,
      maxHistoryLength = 10,
    } = options || {};

    const parts: string[] = [];

    // Project context
    if (includeProject && this.projectContext) {
      parts.push(`## Project`);
      if (this.projectContext.name) parts.push(`Name: ${this.projectContext.name}`);
      if (this.projectContext.type) parts.push(`Type: ${this.projectContext.type}`);
      if (this.projectContext.packageManager) parts.push(`Package Manager: ${this.projectContext.packageManager}`);
    }

    // Git context
    if (includeGit && this.gitContext) {
      parts.push(`\n## Git Status`);
      if (this.gitContext.branch) parts.push(`Branch: ${this.gitContext.branch}`);
      if (this.gitContext.hasChanges) {
        if (this.gitContext.modifiedFiles?.length) {
          parts.push(`Modified: ${this.gitContext.modifiedFiles.join(', ')}`);
        }
        if (this.gitContext.stagedFiles?.length) {
          parts.push(`Staged: ${this.gitContext.stagedFiles.join(', ')}`);
        }
      }
    }

    // File context
    if (includeFile && this.fileContext) {
      parts.push(`\n## Current File: ${this.fileContext.path}`);
      if (this.fileContext.language) parts.push(`Language: ${this.fileContext.language}`);
      if (this.fileContext.isDirty) parts.push(`(unsaved changes)`);
      
      const content = this.fileContext.content.slice(0, maxFileLength);
      parts.push(`\`\`\`${this.fileContext.language || ''}\n${content}\n\`\`\``);
      
      if (this.fileContext.selection?.text) {
        parts.push(`\nSelected text:\n\`\`\`\n${this.fileContext.selection.text}\n\`\`\``);
      }
    }

    // Terminal context
    if (includeTerminal && this.terminalContext) {
      parts.push(`\n## Terminal`);
      parts.push(`Working Directory: ${this.terminalContext.workingDirectory}`);
      
      if (this.terminalContext.history.length > 0) {
        const recentHistory = this.terminalContext.history.slice(-maxHistoryLength);
        parts.push(`Recent commands:\n${recentHistory.map(c => `$ ${c}`).join('\n')}`);
      }
      
      if (this.terminalContext.lastOutput) {
        parts.push(`\nLast output:\n${this.terminalContext.lastOutput.slice(0, 500)}`);
      }
      
      if (this.terminalContext.lastError) {
        parts.push(`\nLast error:\n${this.terminalContext.lastError.slice(0, 500)}`);
      }
    }

    return parts.join('\n');
  }

  // Clear all context
  clear(): void {
    this.fileContext = null;
    this.terminalContext = null;
    this.gitContext = null;
    this.projectContext = null;
  }

  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
let contextInjectorInstance: ContextInjector | null = null;

export function getContextInjector(sessionId?: string): ContextInjector {
  if (!contextInjectorInstance) {
    contextInjectorInstance = new ContextInjector(sessionId);
  }
  return contextInjectorInstance;
}

// Legacy export for backward compatibility
export function collectContext(overrides?: Partial<AgentContext>): AgentContext {
  const injector = getContextInjector();
  return injector.collectContext(overrides);
}

export default ContextInjector;
