// Types
export interface CodeServerConfig {
  host?: string;
  port?: number;
  password?: string;
  workspaceFolder?: string;
  extensions?: string[];
  settings?: Record<string, unknown>;
}

export interface CodeServerStatus {
  running: boolean;
  url?: string;
  pid?: number;
  version?: string;
  error?: string;
}

export interface FileOperation {
  type: 'read' | 'write' | 'delete' | 'rename' | 'create';
  path: string;
  content?: string;
  newPath?: string;
}

export interface EditorState {
  activeFile?: string;
  openFiles: string[];
  dirtyFiles: string[];
  selection?: {
    path: string;
    start: { line: number; column: number };
    end: { line: number; column: number };
    text: string;
  };
}

// Event types
export type CodeServerEventType = 
  | 'ready'
  | 'file-open'
  | 'file-close'
  | 'file-change'
  | 'file-save'
  | 'selection-change'
  | 'terminal-output'
  | 'error';

export interface CodeServerEvent {
  type: CodeServerEventType;
  payload: unknown;
  timestamp: number;
}

type EventCallback = (event: CodeServerEvent) => void;

// Code Server Bridge class
export class CodeServerBridge {
  private config: CodeServerConfig;
  private status: CodeServerStatus = { running: false };
  private iframe: HTMLIFrameElement | null = null;
  private eventListeners: Map<CodeServerEventType, Set<EventCallback>> = new Map();
  private editorState: EditorState = { openFiles: [], dirtyFiles: [] };
  private messageQueue: Array<{ type: string; payload: unknown }> = [];
  private isReady = false;

  constructor(config: CodeServerConfig = {}) {
    this.config = {
      host: 'localhost',
      port: 8080,
      ...config,
    };
  }

  // Initialize bridge with iframe reference
  initialize(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
    this.setupMessageListener();
  }

  // Setup message listener for iframe communication
  private setupMessageListener(): void {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  // Handle incoming messages from code-server
  private handleMessage(event: MessageEvent): void {
    // Verify origin
    const expectedOrigin = `http://${this.config.host}:${this.config.port}`;
    if (!event.origin.includes(this.config.host || 'localhost')) {
      return;
    }

    const message = event.data;
    if (!message || typeof message.type !== 'string') return;

    const codeServerEvent: CodeServerEvent = {
      type: message.type as CodeServerEventType,
      payload: message.payload,
      timestamp: Date.now(),
    };

    // Update internal state
    this.updateState(codeServerEvent);

    // Emit event to listeners
    this.emit(codeServerEvent);

    // Handle ready state
    if (message.type === 'ready') {
      this.isReady = true;
      this.status.running = true;
      this.flushMessageQueue();
    }
  }

  // Update internal editor state based on events
  private updateState(event: CodeServerEvent): void {
    switch (event.type) {
      case 'file-open':
        const openPayload = event.payload as { path: string };
        this.editorState.activeFile = openPayload.path;
        if (!this.editorState.openFiles.includes(openPayload.path)) {
          this.editorState.openFiles.push(openPayload.path);
        }
        break;

      case 'file-close':
        const closePayload = event.payload as { path: string };
        this.editorState.openFiles = this.editorState.openFiles.filter(
          (f) => f !== closePayload.path
        );
        if (this.editorState.activeFile === closePayload.path) {
          this.editorState.activeFile = this.editorState.openFiles[0];
        }
        break;

      case 'file-change':
        const changePayload = event.payload as { path: string; isDirty: boolean };
        if (changePayload.isDirty && !this.editorState.dirtyFiles.includes(changePayload.path)) {
          this.editorState.dirtyFiles.push(changePayload.path);
        }
        break;

      case 'file-save':
        const savePayload = event.payload as { path: string };
        this.editorState.dirtyFiles = this.editorState.dirtyFiles.filter(
          (f) => f !== savePayload.path
        );
        break;

      case 'selection-change':
        this.editorState.selection = event.payload as EditorState['selection'];
        break;
    }
  }

  // Send message to code-server
  private sendMessage(type: string, payload?: unknown): void {
    const message = { type, payload };

    if (!this.isReady) {
      this.messageQueue.push(message);
      return;
    }

    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(message, '*');
    }
  }

  // Flush queued messages after ready
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage(message, '*');
      }
    }
  }

  // Event emitter methods
  on(event: CodeServerEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: CodeServerEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  // Public API methods

  // Get current status
  getStatus(): CodeServerStatus {
    return { ...this.status };
  }

  // Get editor state
  getEditorState(): EditorState {
    return { ...this.editorState };
  }

  // Get URL for iframe
  getUrl(): string {
    const { host, port, password, workspaceFolder } = this.config;
    let url = `http://${host}:${port}`;
    
    const params = new URLSearchParams();
    if (workspaceFolder) {
      params.set('folder', workspaceFolder);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    return url;
  }

  // Open a file
  openFile(path: string, options?: { line?: number; column?: number }): void {
    this.sendMessage('open-file', { path, ...options });
  }

  // Close a file
  closeFile(path: string): void {
    this.sendMessage('close-file', { path });
  }

  // Save current file
  saveFile(path?: string): void {
    this.sendMessage('save-file', { path: path || this.editorState.activeFile });
  }

  // Save all files
  saveAllFiles(): void {
    this.sendMessage('save-all');
  }

  // Go to specific line
  goToLine(line: number, column = 1): void {
    this.sendMessage('go-to-line', { line, column });
  }

  // Insert text at cursor
  insertText(text: string): void {
    this.sendMessage('insert-text', { text });
  }

  // Replace current selection
  replaceSelection(text: string): void {
    this.sendMessage('replace-selection', { text });
  }

  // Execute VS Code command
  executeCommand(command: string, args?: unknown[]): void {
    this.sendMessage('execute-command', { command, args });
  }

  // Apply settings
  applySettings(settings: Record<string, unknown>): void {
    this.sendMessage('settings', settings);
  }

  // Install extension
  installExtension(extensionId: string): void {
    this.sendMessage('install-extension', { extensionId });
  }

  // Get file content
  async getFileContent(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.on('file-content', (event) => {
        const payload = event.payload as { path: string; content: string };
        if (payload.path === path) {
          unsubscribe();
          resolve(payload.content);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout getting file content'));
      }, 5000);

      this.sendMessage('get-file-content', { path });
    });
  }

  // Write file content
  writeFile(path: string, content: string): void {
    this.sendMessage('write-file', { path, content });
  }

  // Create new file
  createFile(path: string, content = ''): void {
    this.sendMessage('create-file', { path, content });
  }

  // Delete file
  deleteFile(path: string): void {
    this.sendMessage('delete-file', { path });
  }

  // Rename file
  renameFile(oldPath: string, newPath: string): void {
    this.sendMessage('rename-file', { oldPath, newPath });
  }

  // Search in files
  searchInFiles(query: string, options?: { include?: string; exclude?: string }): void {
    this.sendMessage('search', { query, ...options });
  }

  // Find and replace
  findAndReplace(find: string, replace: string, options?: { regex?: boolean; caseSensitive?: boolean }): void {
    this.sendMessage('find-replace', { find, replace, ...options });
  }

  // Format document
  formatDocument(): void {
    this.executeCommand('editor.action.formatDocument');
  }

  // Toggle terminal
  toggleTerminal(): void {
    this.executeCommand('workbench.action.terminal.toggleTerminal');
  }

  // Run terminal command
  runTerminalCommand(command: string): void {
    this.sendMessage('terminal-command', { command });
  }

  // Cleanup
  dispose(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
    this.eventListeners.clear();
    this.iframe = null;
  }
}

// Singleton instance
let bridgeInstance: CodeServerBridge | null = null;

export function getCodeServerBridge(config?: CodeServerConfig): CodeServerBridge {
  if (!bridgeInstance) {
    bridgeInstance = new CodeServerBridge(config);
  }
  return bridgeInstance;
}

// Legacy export for backward compatibility
export async function startCodeServer(config?: CodeServerConfig): Promise<{ url: string }> {
  const bridge = getCodeServerBridge(config);
  return { url: bridge.getUrl() };
}

export default CodeServerBridge;
