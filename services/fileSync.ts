// Types
export interface FileEntry {
  path: string;
  content: string;
  hash: string;
  lastModified: number;
  isDirty: boolean;
}

export interface SyncConflict {
  path: string;
  localContent: string;
  remoteContent: string;
  localModified: number;
  remoteModified: number;
}

export interface SyncResult {
  success: boolean;
  synced: string[];
  conflicts: SyncConflict[];
  errors: Array<{ path: string; error: string }>;
}

export type SyncDirection = 'push' | 'pull' | 'bidirectional';
export type ConflictResolution = 'local' | 'remote' | 'merge' | 'skip';

export interface FileSyncConfig {
  debounceMs?: number;
  autoSync?: boolean;
  conflictResolution?: ConflictResolution;
  excludePatterns?: string[];
  includePatterns?: string[];
}

type SyncEventType = 'sync-start' | 'sync-complete' | 'conflict' | 'error' | 'file-changed';
type SyncEventCallback = (event: { type: SyncEventType; payload: unknown }) => void;

// Simple hash function for content comparison
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// File Sync Service
export class FileSyncService {
  private config: FileSyncConfig;
  private localFiles: Map<string, FileEntry> = new Map();
  private remoteFiles: Map<string, FileEntry> = new Map();
  private pendingChanges: Map<string, FileEntry> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<SyncEventType, Set<SyncEventCallback>> = new Map();
  private isSyncing = false;

  // Callbacks for actual file operations (to be set by consumer)
  private readLocalFile: ((path: string) => Promise<string | null>) | null = null;
  private writeLocalFile: ((path: string, content: string) => Promise<boolean>) | null = null;
  private readRemoteFile: ((path: string) => Promise<string | null>) | null = null;
  private writeRemoteFile: ((path: string, content: string) => Promise<boolean>) | null = null;

  constructor(config: FileSyncConfig = {}) {
    this.config = {
      debounceMs: 500,
      autoSync: true,
      conflictResolution: 'local',
      excludePatterns: ['node_modules/**', '.git/**', '*.log'],
      includePatterns: ['**/*'],
      ...config,
    };
  }

  // Set file operation handlers
  setHandlers(handlers: {
    readLocal?: (path: string) => Promise<string | null>;
    writeLocal?: (path: string, content: string) => Promise<boolean>;
    readRemote?: (path: string) => Promise<string | null>;
    writeRemote?: (path: string, content: string) => Promise<boolean>;
  }): void {
    if (handlers.readLocal) this.readLocalFile = handlers.readLocal;
    if (handlers.writeLocal) this.writeLocalFile = handlers.writeLocal;
    if (handlers.readRemote) this.readRemoteFile = handlers.readRemote;
    if (handlers.writeRemote) this.writeRemoteFile = handlers.writeRemote;
  }

  // Event handling
  on(event: SyncEventType, callback: SyncEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.eventListeners.get(event)?.delete(callback);
  }

  private emit(type: SyncEventType, payload: unknown): void {
    this.eventListeners.get(type)?.forEach((cb) => cb({ type, payload }));
  }

  // Check if path matches patterns
  private matchesPattern(path: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      const regex = new RegExp(
        '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
      );
      return regex.test(path);
    });
  }

  // Should sync this file?
  private shouldSync(path: string): boolean {
    const { excludePatterns = [], includePatterns = [] } = this.config;
    
    if (this.matchesPattern(path, excludePatterns)) {
      return false;
    }
    
    if (includePatterns.length > 0 && !this.matchesPattern(path, includePatterns)) {
      return false;
    }
    
    return true;
  }

  // Track local file change
  trackLocalChange(path: string, content: string): void {
    if (!this.shouldSync(path)) return;

    const hash = hashContent(content);
    const entry: FileEntry = {
      path,
      content,
      hash,
      lastModified: Date.now(),
      isDirty: true,
    };

    this.localFiles.set(path, entry);
    this.pendingChanges.set(path, entry);
    this.emit('file-changed', { path, source: 'local' });

    if (this.config.autoSync) {
      this.scheduleSyncDebounced();
    }
  }

  // Track remote file change
  trackRemoteChange(path: string, content: string): void {
    if (!this.shouldSync(path)) return;

    const hash = hashContent(content);
    const entry: FileEntry = {
      path,
      content,
      hash,
      lastModified: Date.now(),
      isDirty: false,
    };

    this.remoteFiles.set(path, entry);
    this.emit('file-changed', { path, source: 'remote' });
  }

  // Schedule debounced sync
  private scheduleSyncDebounced(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.sync('push');
    }, this.config.debounceMs);
  }

  // Main sync function
  async sync(direction: SyncDirection = 'bidirectional'): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: [],
        conflicts: [],
        errors: [{ path: '', error: 'Sync already in progress' }],
      };
    }

    this.isSyncing = true;
    this.emit('sync-start', { direction });

    const result: SyncResult = {
      success: true,
      synced: [],
      conflicts: [],
      errors: [],
    };

    try {
      const paths = new Set([
        ...this.pendingChanges.keys(),
        ...(direction === 'bidirectional' ? this.remoteFiles.keys() : []),
      ]);

      for (const path of paths) {
        try {
          const syncResult = await this.syncFile(path, direction);
          
          if (syncResult.conflict) {
            result.conflicts.push(syncResult.conflict);
          } else if (syncResult.synced) {
            result.synced.push(path);
          }
        } catch (error) {
          result.errors.push({
            path,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          result.success = false;
        }
      }

      // Clear pending changes for successfully synced files
      result.synced.forEach((path) => this.pendingChanges.delete(path));

    } finally {
      this.isSyncing = false;
      this.emit('sync-complete', result);
    }

    return result;
  }

  // Sync individual file
  private async syncFile(
    path: string,
    direction: SyncDirection
  ): Promise<{ synced: boolean; conflict?: SyncConflict }> {
    const local = this.localFiles.get(path);
    const remote = this.remoteFiles.get(path);

    // No changes
    if (!local && !remote) {
      return { synced: false };
    }

    // Only local exists - push
    if (local && !remote && (direction === 'push' || direction === 'bidirectional')) {
      if (this.writeRemoteFile) {
        await this.writeRemoteFile(path, local.content);
        this.remoteFiles.set(path, { ...local, isDirty: false });
      }
      return { synced: true };
    }

    // Only remote exists - pull
    if (!local && remote && (direction === 'pull' || direction === 'bidirectional')) {
      if (this.writeLocalFile) {
        await this.writeLocalFile(path, remote.content);
        this.localFiles.set(path, { ...remote, isDirty: false });
      }
      return { synced: true };
    }

    // Both exist - check for conflicts
    if (local && remote) {
      // Same content - no sync needed
      if (local.hash === remote.hash) {
        return { synced: false };
      }

      // Conflict detected
      const conflict: SyncConflict = {
        path,
        localContent: local.content,
        remoteContent: remote.content,
        localModified: local.lastModified,
        remoteModified: remote.lastModified,
      };

      // Auto-resolve based on config
      const resolution = this.config.conflictResolution;
      
      if (resolution === 'local') {
        if (this.writeRemoteFile) {
          await this.writeRemoteFile(path, local.content);
          this.remoteFiles.set(path, { ...local, isDirty: false });
        }
        return { synced: true };
      } else if (resolution === 'remote') {
        if (this.writeLocalFile) {
          await this.writeLocalFile(path, remote.content);
          this.localFiles.set(path, { ...remote, isDirty: false });
        }
        return { synced: true };
      } else if (resolution === 'skip') {
        return { synced: false, conflict };
      } else {
        // 'merge' - emit conflict for manual resolution
        this.emit('conflict', conflict);
        return { synced: false, conflict };
      }
    }

    return { synced: false };
  }

  // Resolve conflict manually
  async resolveConflict(path: string, resolution: ConflictResolution, mergedContent?: string): Promise<boolean> {
    const local = this.localFiles.get(path);
    const remote = this.remoteFiles.get(path);

    if (!local || !remote) return false;

    try {
      if (resolution === 'local') {
        if (this.writeRemoteFile) {
          await this.writeRemoteFile(path, local.content);
          this.remoteFiles.set(path, { ...local, isDirty: false });
        }
      } else if (resolution === 'remote') {
        if (this.writeLocalFile) {
          await this.writeLocalFile(path, remote.content);
          this.localFiles.set(path, { ...remote, isDirty: false });
        }
      } else if (resolution === 'merge' && mergedContent) {
        const merged: FileEntry = {
          path,
          content: mergedContent,
          hash: hashContent(mergedContent),
          lastModified: Date.now(),
          isDirty: false,
        };
        
        if (this.writeLocalFile) await this.writeLocalFile(path, mergedContent);
        if (this.writeRemoteFile) await this.writeRemoteFile(path, mergedContent);
        
        this.localFiles.set(path, merged);
        this.remoteFiles.set(path, merged);
      }

      this.pendingChanges.delete(path);
      return true;
    } catch {
      return false;
    }
  }

  // Get pending changes
  getPendingChanges(): string[] {
    return Array.from(this.pendingChanges.keys());
  }

  // Get file status
  getFileStatus(path: string): { local?: FileEntry; remote?: FileEntry; hasConflict: boolean } {
    const local = this.localFiles.get(path);
    const remote = this.remoteFiles.get(path);
    const hasConflict = !!(local && remote && local.hash !== remote.hash);
    return { local, remote, hasConflict };
  }

  // Clear all tracked files
  clear(): void {
    this.localFiles.clear();
    this.remoteFiles.clear();
    this.pendingChanges.clear();
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Dispose
  dispose(): void {
    this.clear();
    this.eventListeners.clear();
  }
}

// Singleton instance
let fileSyncInstance: FileSyncService | null = null;

export function getFileSyncService(config?: FileSyncConfig): FileSyncService {
  if (!fileSyncInstance) {
    fileSyncInstance = new FileSyncService(config);
  }
  return fileSyncInstance;
}

// Legacy export for backward compatibility
export function syncFileToVFS(path: string, content: string): Promise<boolean> {
  const service = getFileSyncService();
  service.trackLocalChange(path, content);
  return Promise.resolve(true);
}

export default FileSyncService;
