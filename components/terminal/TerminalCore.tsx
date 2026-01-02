import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { clsx } from 'clsx';

export interface TerminalCoreProps {
  className?: string;
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onReady?: (terminal: Terminal) => void;
  fontSize?: number;
  fontFamily?: string;
  cursorBlink?: boolean;
  cursorStyle?: 'block' | 'underline' | 'bar';
  theme?: TerminalTheme;
  scrollback?: number;
}

export interface TerminalTheme {
  background?: string;
  foreground?: string;
  cursor?: string;
  cursorAccent?: string;
  selection?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
}

export interface TerminalCoreRef {
  terminal: Terminal | null;
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
  scrollToBottom: () => void;
}

const defaultTheme: TerminalTheme = {
  background: '#0d0d0f',
  foreground: '#e4e4e7',
  cursor: '#6366f1',
  cursorAccent: '#0d0d0f',
  selection: 'rgba(99, 102, 241, 0.3)',
  black: '#09090b',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#22d3ee',
  white: '#e4e4e7',
  brightBlack: '#52525b',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#67e8f9',
  brightWhite: '#fafafa',
};

export const TerminalCore = forwardRef<TerminalCoreRef, TerminalCoreProps>(
  (
    {
      className,
      onData,
      onResize,
      onReady,
      fontSize = 13,
      fontFamily = "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
      cursorBlink = true,
      cursorStyle = 'bar',
      theme = defaultTheme,
      scrollback = 5000,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize terminal
    useEffect(() => {
      if (!containerRef.current || terminalRef.current) return;

      const terminal = new Terminal({
        fontSize,
        fontFamily,
        cursorBlink,
        cursorStyle,
        theme: { ...defaultTheme, ...theme },
        scrollback,
        allowProposedApi: true,
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(containerRef.current);
      fitAddon.fit();

      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Handle data input
      terminal.onData((data) => {
        onData?.(data);
      });

      // Handle resize
      terminal.onResize(({ cols, rows }) => {
        onResize?.(cols, rows);
      });

      setIsReady(true);
      onReady?.(terminal);

      return () => {
        terminal.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
      };
    }, []);

    // Handle container resize
    useEffect(() => {
      if (!containerRef.current || !fitAddonRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddonRef.current?.fit();
        } catch {
          // Ignore fit errors during rapid resizing
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, [isReady]);

    // Update theme
    useEffect(() => {
      if (terminalRef.current) {
        terminalRef.current.options.theme = { ...defaultTheme, ...theme };
      }
    }, [theme]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      terminal: terminalRef.current,
      write: (data: string) => terminalRef.current?.write(data),
      writeln: (data: string) => terminalRef.current?.writeln(data),
      clear: () => terminalRef.current?.clear(),
      focus: () => terminalRef.current?.focus(),
      fit: () => fitAddonRef.current?.fit(),
      scrollToBottom: () => terminalRef.current?.scrollToBottom(),
    }));

    return (
      <div
        ref={containerRef}
        className={clsx(
          'w-full h-full overflow-hidden',
          'bg-[var(--dm-terminal-bg)]',
          className
        )}
        style={{
          padding: '8px',
        }}
      />
    );
  }
);

TerminalCore.displayName = 'TerminalCore';

export default TerminalCore;
