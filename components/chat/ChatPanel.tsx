import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinking?: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: string;
  }>;
  attachments?: FileAttachment[];
  isStreaming?: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'selection' | 'folder';
  content?: string;
  language?: string;
  lineRange?: { start: number; end: number };
}

export interface FileMention {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
}

export interface ChatPanelProps {
  messages?: ChatMessage[];
  onSendMessage?: (content: string, attachments?: FileAttachment[]) => void;
  onStopGeneration?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  availableFiles?: FileMention[];
  onFileSelect?: (file: FileMention) => void;
  className?: string;
}

// File mention popup
interface FileMentionPopupProps {
  files: FileMention[];
  searchQuery: string;
  onSelect: (file: FileMention) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const FileMentionPopup: React.FC<FileMentionPopupProps> = ({
  files,
  searchQuery,
  onSelect,
  onClose,
  position,
}) => {
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return files
      .filter((f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query))
      .slice(0, 10);
  }, [files, searchQuery]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredFiles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredFiles.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredFiles, selectedIndex, onSelect, onClose]);

  if (filteredFiles.length === 0) return null;

  return (
    <div
      className={clsx(
        'absolute z-50 w-64 max-h-48 overflow-auto',
        'bg-[var(--dm-surface-dropdown)] border border-[var(--dm-border-primary)]',
        'rounded-lg shadow-xl py-1',
        'animate-fade-in'
      )}
      style={{ top: position.top, left: position.left }}
    >
      {filteredFiles.map((file, index) => (
        <button
          key={file.id}
          onClick={() => onSelect(file)}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 text-left',
            'transition-colors',
            index === selectedIndex
              ? 'bg-[var(--dm-bg-hover)] text-[var(--dm-text-primary)]'
              : 'text-[var(--dm-text-secondary)] hover:bg-[var(--dm-bg-hover)]'
          )}
        >
          <span className="w-4 h-4 flex-shrink-0">
            {file.type === 'folder' ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-[var(--dm-warning)]">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--dm-text-muted)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-[var(--dm-text-muted)] truncate">{file.path}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

// Message component
interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div
      className={clsx(
        'flex gap-3 p-4',
        message.role === 'user' ? 'bg-transparent' : 'bg-[var(--dm-bg-secondary)]'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          message.role === 'user'
            ? 'bg-[var(--dm-accent-primary)]'
            : 'bg-gradient-to-br from-purple-500 to-blue-500'
        )}
      >
        {message.role === 'user' ? (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Thinking (collapsible) */}
        {message.thinking && (
          <div className="mb-2">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1 text-xs text-[var(--dm-text-muted)] hover:text-[var(--dm-text-secondary)]"
            >
              <svg
                className={clsx('w-3 h-3 transition-transform', showThinking && 'rotate-90')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Thinking...
            </button>
            {showThinking && (
              <div className="mt-1 p-2 text-xs text-[var(--dm-text-muted)] bg-[var(--dm-bg-tertiary)] rounded border-l-2 border-[var(--dm-border-secondary)]">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-1 rounded',
                  'bg-[var(--dm-bg-tertiary)] text-xs text-[var(--dm-text-secondary)]'
                )}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="truncate max-w-[150px]">{attachment.name}</span>
                {attachment.lineRange && (
                  <span className="text-[var(--dm-text-muted)]">
                    L{attachment.lineRange.start}-{attachment.lineRange.end}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="text-sm text-[var(--dm-text-primary)] whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--dm-accent-primary)] animate-pulse" />
            )}
          </div>
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((tool, index) => (
              <div
                key={index}
                className="p-2 rounded bg-[var(--dm-bg-tertiary)] border border-[var(--dm-border-primary)]"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--dm-text-secondary)]">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                  {tool.name}
                </div>
                {tool.result && (
                  <pre className="mt-1 text-xs text-[var(--dm-text-muted)] overflow-x-auto">
                    {tool.result}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 text-[10px] text-[var(--dm-text-muted)]">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// Main ChatPanel component
export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages = [],
  onSendMessage,
  onStopGeneration,
  isGenerating = false,
  placeholder = 'Ask anything... Use @ to mention files',
  availableFiles = [],
  onFileSelect,
  className,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input change with @ mention detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Detect @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\S*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentionPopup(true);
      
      // Calculate popup position
      const textarea = e.target;
      const rect = textarea.getBoundingClientRect();
      setMentionPosition({
        top: rect.top - 200, // Above the input
        left: rect.left,
      });
    } else {
      setShowMentionPopup(false);
    }
  }, []);

  // Handle file mention selection
  const handleMentionSelect = useCallback((file: FileMention) => {
    // Replace @query with file reference
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = input.slice(0, cursorPos);
    const textAfterCursor = input.slice(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const newInput = textBeforeCursor.slice(0, atIndex) + `@${file.name} ` + textAfterCursor;
    setInput(newInput);
    
    // Add as attachment
    const attachment: FileAttachment = {
      id: file.id,
      name: file.name,
      path: file.path,
      type: file.type,
    };
    setAttachments((prev) => [...prev, attachment]);
    
    setShowMentionPopup(false);
    onFileSelect?.(file);
    inputRef.current?.focus();
  }, [input, onFileSelect]);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    if (!input.trim() && attachments.length === 0) return;
    
    onSendMessage?.(input, attachments);
    setInput('');
    setAttachments([]);
  }, [input, attachments, onSendMessage]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={clsx('flex flex-col h-full bg-[var(--dm-bg-primary)]', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--dm-text-primary)] mb-2">
              DevMind AI Assistant
            </h3>
            <p className="text-sm text-[var(--dm-text-secondary)] max-w-md">
              Ask me anything about your code. Use <kbd className="px-1.5 py-0.5 rounded bg-[var(--dm-bg-tertiary)] text-xs">@</kbd> to mention files for context.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--dm-border-primary)]">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--dm-border-primary)] p-4">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-1 rounded',
                  'bg-[var(--dm-bg-tertiary)] text-xs'
                )}
              >
                <svg className="w-3 h-3 text-[var(--dm-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="text-[var(--dm-text-secondary)]">{attachment.name}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="p-0.5 text-[var(--dm-text-muted)] hover:text-[var(--dm-text-primary)]"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            rows={1}
            className={clsx(
              'w-full resize-none rounded-lg px-4 py-3 pr-24',
              'bg-[var(--dm-bg-secondary)] border border-[var(--dm-border-primary)]',
              'text-sm text-[var(--dm-text-primary)] placeholder:text-[var(--dm-text-muted)]',
              'focus:outline-none focus:border-[var(--dm-border-focus)] focus:ring-1 focus:ring-[var(--dm-ring-color)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />

          {/* Actions */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {isGenerating ? (
              <button
                onClick={onStopGeneration}
                className={clsx(
                  'p-2 rounded-md',
                  'bg-[var(--dm-error)] text-white',
                  'hover:bg-[var(--dm-error-hover)] transition-colors'
                )}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  input.trim() || attachments.length > 0
                    ? 'bg-[var(--dm-accent-primary)] text-white hover:bg-[var(--dm-accent-primary-hover)]'
                    : 'bg-[var(--dm-bg-tertiary)] text-[var(--dm-text-muted)] cursor-not-allowed'
                )}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            )}
          </div>

          {/* File mention popup */}
          {showMentionPopup && (
            <FileMentionPopup
              files={availableFiles}
              searchQuery={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentionPopup(false)}
              position={mentionPosition}
            />
          )}
        </div>

        {/* Hints */}
        <div className="mt-2 flex items-center gap-4 text-[10px] text-[var(--dm-text-muted)]">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[var(--dm-bg-tertiary)]">Enter</kbd> to send
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[var(--dm-bg-tertiary)]">Shift+Enter</kbd> for new line
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[var(--dm-bg-tertiary)]">@</kbd> to mention files
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
