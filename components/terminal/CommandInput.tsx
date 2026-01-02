import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';

// AI Provider prefixes
export const AI_PREFIXES = {
  gemini: '@gemini',
  openai: '@openai',
  anthropic: '@anthropic',
  ollama: '@ollama',
  ai: '@ai', // Default/auto
} as const;

export type AIProvider = keyof typeof AI_PREFIXES;

export interface ParsedCommand {
  raw: string;
  isAICommand: boolean;
  provider?: AIProvider;
  prompt?: string;
  command?: string;
  args?: string[];
}

export interface CommandInputProps {
  className?: string;
  placeholder?: string;
  onSubmit?: (parsed: ParsedCommand) => void;
  onAICommand?: (provider: AIProvider, prompt: string) => void;
  onShellCommand?: (command: string) => void;
  onHistoryNavigate?: (direction: 'up' | 'down') => string | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  showProviderHint?: boolean;
  defaultProvider?: AIProvider;
}

export interface CommandInputRef {
  focus: () => void;
  clear: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
}

function parseCommand(input: string, defaultProvider: AIProvider = 'gemini'): ParsedCommand {
  const trimmed = input.trim();
  
  // Check for AI command prefixes
  for (const [provider, prefix] of Object.entries(AI_PREFIXES)) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      const prompt = trimmed.slice(prefix.length).trim();
      return {
        raw: input,
        isAICommand: true,
        provider: provider as AIProvider,
        prompt,
      };
    }
  }
  
  // Check for natural language patterns that suggest AI intent
  const aiPatterns = [
    /^(explain|describe|what is|how to|why|can you|please|help me)/i,
    /^(create|generate|write|make|build|implement)/i,
    /^(fix|debug|solve|analyze|review)/i,
  ];
  
  const looksLikeAI = aiPatterns.some(pattern => pattern.test(trimmed));
  
  if (looksLikeAI) {
    return {
      raw: input,
      isAICommand: true,
      provider: defaultProvider,
      prompt: trimmed,
    };
  }
  
  // Parse as shell command
  const parts = trimmed.split(/\s+/);
  return {
    raw: input,
    isAICommand: false,
    command: parts[0],
    args: parts.slice(1),
  };
}

export const CommandInput = forwardRef<CommandInputRef, CommandInputProps>(
  (
    {
      className,
      placeholder = 'Type a command or @gemini to ask AI...',
      onSubmit,
      onAICommand,
      onShellCommand,
      onHistoryNavigate,
      disabled = false,
      autoFocus = false,
      showProviderHint = true,
      defaultProvider = 'gemini',
    },
    ref
  ) => {
    const [value, setValue] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [detectedProvider, setDetectedProvider] = useState<AIProvider | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Detect AI provider as user types
    useEffect(() => {
      const lower = value.toLowerCase();
      for (const [provider, prefix] of Object.entries(AI_PREFIXES)) {
        if (lower.startsWith(prefix)) {
          setDetectedProvider(provider as AIProvider);
          return;
        }
      }
      setDetectedProvider(null);
    }, [value]);

    const handleSubmit = useCallback(() => {
      if (!value.trim() || disabled) return;

      const parsed = parseCommand(value, defaultProvider);
      onSubmit?.(parsed);

      if (parsed.isAICommand && parsed.provider && parsed.prompt) {
        onAICommand?.(parsed.provider, parsed.prompt);
      } else if (parsed.command) {
        onShellCommand?.(value);
      }

      setValue('');
      setHistoryIndex(-1);
    }, [value, disabled, defaultProvider, onSubmit, onAICommand, onShellCommand]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = onHistoryNavigate?.('up');
          if (prev !== undefined) {
            setValue(prev);
            setHistoryIndex((i) => i + 1);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = onHistoryNavigate?.('down');
          if (next !== undefined) {
            setValue(next);
            setHistoryIndex((i) => Math.max(-1, i - 1));
          } else {
            setValue('');
            setHistoryIndex(-1);
          }
        } else if (e.key === 'Tab') {
          // Auto-complete AI prefix
          if (!value.startsWith('@') && value.length === 0) {
            e.preventDefault();
            setValue('@gemini ');
          }
        } else if (e.key === 'Escape') {
          setValue('');
          setHistoryIndex(-1);
        }
      },
      [handleSubmit, onHistoryNavigate, value]
    );

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setValue(''),
      setValue: (v: string) => setValue(v),
      getValue: () => value,
    }));

    // Auto-focus
    useEffect(() => {
      if (autoFocus) {
        inputRef.current?.focus();
      }
    }, [autoFocus]);

    const providerColors: Record<AIProvider, string> = {
      gemini: 'text-blue-400',
      openai: 'text-green-400',
      anthropic: 'text-orange-400',
      ollama: 'text-purple-400',
      ai: 'text-cyan-400',
    };

    return (
      <div className={clsx('relative flex items-center', className)}>
        {/* Prompt indicator */}
        <div className="flex items-center gap-2 px-3 text-[var(--dm-terminal-prompt)]">
          <span className="text-sm font-mono">❯</span>
          {showProviderHint && detectedProvider && (
            <span
              className={clsx(
                'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
                'bg-[var(--dm-bg-tertiary)]',
                providerColors[detectedProvider]
              )}
            >
              {detectedProvider}
            </span>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            'flex-1 bg-transparent outline-none',
            'text-[var(--dm-terminal-text)] placeholder:text-[var(--dm-text-muted)]',
            'font-mono text-sm py-2 pr-3',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* Submit button (optional, for touch devices) */}
        {value.trim() && (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={clsx(
              'px-3 py-1 mr-2 rounded text-xs font-medium',
              'bg-[var(--dm-accent-primary)] text-white',
              'hover:bg-[var(--dm-accent-primary-hover)]',
              'transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            Run
          </button>
        )}
      </div>
    );
  }
);

CommandInput.displayName = 'CommandInput';

export default CommandInput;
