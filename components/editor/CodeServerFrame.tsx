import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';

// Types for code-server communication
export interface CodeServerMessage {
  type: string;
  payload?: unknown;
}

export interface FileOpenEvent {
  path: string;
  content?: string;
  language?: string;
}

export interface SelectionChangeEvent {
  path: string;
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
    text: string;
  };
}

export interface FileChangeEvent {
  path: string;
  content: string;
  isDirty: boolean;
}

export interface CodeServerFrameProps {
  src?: string;
  className?: string;
  onReady?: () => void;
  onFileOpen?: (event: FileOpenEvent) => void;
  onFileChange?: (event: FileChangeEvent) => void;
  onSelectionChange?: (event: SelectionChangeEvent) => void;
  onError?: (error: Error) => void;
  theme?: 'dark' | 'light';
  fontSize?: number;
  tabSize?: number;
}

export interface CodeServerFrameRef {
  openFile: (path: string) => void;
  goToLine: (path: string, line: number, column?: number) => void;
  insertText: (text: string) => void;
  replaceSelection: (text: string) => void;
  executeCommand: (command: string) => void;
  getActiveFile: () => string | null;
  reload: () => void;
}

export const CodeServerFrame = forwardRef<CodeServerFrameRef, CodeServerFrameProps>(
  (
    {
      src,
      className,
      onReady,
      onFileOpen,
      onFileChange,
      onSelectionChange,
      onError,
      theme = 'dark',
      fontSize = 14,
      tabSize = 2,
    },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFile, setActiveFile] = useState<string | null>(null);

    // Send message to code-server
    const sendMessage = useCallback((message: CodeServerMessage) => {
      if (!iframeRef.current?.contentWindow) return;
      
      try {
        iframeRef.current.contentWindow.postMessage(message, '*');
      } catch (err) {
        console.error('Failed to send message to code-server:', err);
      }
    }, []);

    // Handle messages from code-server
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Verify origin if needed
        if (!src || !event.origin.includes(new URL(src).host)) {
          return;
        }

        const message = event.data as CodeServerMessage;
        
        switch (message.type) {
          case 'ready':
            setIsReady(true);
            setIsLoading(false);
            onReady?.();
            // Apply initial settings
            sendMessage({
              type: 'settings',
              payload: { theme, fontSize, tabSize },
            });
            break;

          case 'file-open':
            const fileOpenEvent = message.payload as FileOpenEvent;
            setActiveFile(fileOpenEvent.path);
            onFileOpen?.(fileOpenEvent);
            break;

          case 'file-change':
            onFileChange?.(message.payload as FileChangeEvent);
            break;

          case 'selection-change':
            onSelectionChange?.(message.payload as SelectionChangeEvent);
            break;

          case 'error':
            const errorMsg = (message.payload as { message: string })?.message || 'Unknown error';
            setError(errorMsg);
            onError?.(new Error(errorMsg));
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [src, onReady, onFileOpen, onFileChange, onSelectionChange, onError, sendMessage, theme, fontSize, tabSize]);

    // Update settings when props change
    useEffect(() => {
      if (isReady) {
        sendMessage({
          type: 'settings',
          payload: { theme, fontSize, tabSize },
        });
      }
    }, [isReady, theme, fontSize, tabSize, sendMessage]);

    // Handle iframe load
    const handleLoad = useCallback(() => {
      setIsLoading(false);
      // Wait for code-server to send ready message
    }, []);

    // Handle iframe error
    const handleError = useCallback(() => {
      setIsLoading(false);
      setError('Failed to load code-server');
      onError?.(new Error('Failed to load code-server'));
    }, [onError]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      openFile: (path: string) => {
        sendMessage({ type: 'open-file', payload: { path } });
      },
      goToLine: (path: string, line: number, column = 1) => {
        sendMessage({ type: 'go-to-line', payload: { path, line, column } });
      },
      insertText: (text: string) => {
        sendMessage({ type: 'insert-text', payload: { text } });
      },
      replaceSelection: (text: string) => {
        sendMessage({ type: 'replace-selection', payload: { text } });
      },
      executeCommand: (command: string) => {
        sendMessage({ type: 'execute-command', payload: { command } });
      },
      getActiveFile: () => activeFile,
      reload: () => {
        if (iframeRef.current && src) {
          setIsLoading(true);
          setIsReady(false);
          iframeRef.current.src = src;
        }
      },
    }));

    return (
      <div className={clsx('relative w-full h-full', className)}>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--dm-bg-primary)] z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-[var(--dm-accent-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--dm-text-muted)]">Loading editor...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--dm-bg-primary)] z-10">
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <svg className="w-16 h-16 text-[var(--dm-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-[var(--dm-text-primary)] mb-2">
                  Failed to load editor
                </h3>
                <p className="text-sm text-[var(--dm-text-secondary)] mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    if (iframeRef.current && src) {
                      setIsLoading(true);
                      iframeRef.current.src = src;
                    }
                  }}
                  className="px-4 py-2 bg-[var(--dm-accent-primary)] text-white rounded-md hover:bg-[var(--dm-accent-primary-hover)] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder when no src */}
        {!src && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--dm-bg-primary)]">
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <svg className="w-16 h-16 text-[var(--dm-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-[var(--dm-text-primary)] mb-2">
                  No editor configured
                </h3>
                <p className="text-sm text-[var(--dm-text-secondary)]">
                  Configure code-server URL to enable the editor
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Iframe */}
        {src && (
          <iframe
            ref={iframeRef}
            title="code-server"
            src={src}
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    );
  }
);

CodeServerFrame.displayName = 'CodeServerFrame';

export default CodeServerFrame;
