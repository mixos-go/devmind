import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

interface TerminalProps {
  lines: string[];
}

const Terminal: React.FC<TerminalProps> = ({ lines }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  // Initialize Terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#09090b', // zinc-950
        foreground: '#d4d4d8', // zinc-300
        cursor: '#22c55e', // green-500
        selectionBackground: '#27272a', // zinc-800
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      rows: 12,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;32mDevMind Agent Terminal v1.0.0\x1b[0m');
    term.writeln('Sandbox Environment Initialized.');
    term.write('$ ');

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Handle Incoming Lines
  useEffect(() => {
    if (!xtermRef.current) return;
    
    // We only print the *last* line added if we want to avoid re-printing history,
    // but React effects run on change. 
    // A better approach for a terminal log is to just print what's new.
    // However, for this simplified component, we can clear and reprint OR check diff.
    // Let's assume the parent passes specific "new lines" via an event or we just
    // write the last one if it's new.
    
    // Hack: Just write the last line if it exists and differs? 
    // Better: The parent `lines` array grows. We keep track of printed index.
  }, [lines]);

  // Use a ref to track printed index
  const lastPrintedIndex = useRef(0);
  useEffect(() => {
      if(!xtermRef.current) return;
      
      const newLines = lines.slice(lastPrintedIndex.current);
      if (newLines.length > 0) {
          // Clear the prompt line (mock)
          xtermRef.current.write('\r\x1b[K'); 
          
          newLines.forEach(line => {
              if (line.startsWith('>')) {
                  // Command/Info
                   xtermRef.current?.writeln(`\x1b[34m${line}\x1b[0m`);
              } else if (line.startsWith('$')) {
                  // User/Agent execution
                   xtermRef.current?.writeln(`\x1b[33m${line}\x1b[0m`);
              } else if (line.toLowerCase().includes('error')) {
                   xtermRef.current?.writeln(`\x1b[31m${line}\x1b[0m`);
              } else if (line.toLowerCase().includes('success')) {
                   xtermRef.current?.writeln(`\x1b[32m${line}\x1b[0m`);
              } else {
                   xtermRef.current?.writeln(line);
              }
          });
          
          xtermRef.current.write('$ ');
          lastPrintedIndex.current = lines.length;
          fitAddonRef.current?.fit();
      }
  }, [lines]);

  return <div className="h-full w-full overflow-hidden" ref={terminalRef} />;
};

export default Terminal;
