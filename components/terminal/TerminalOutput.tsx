import React from 'react';

export const TerminalOutput: React.FC<{ output?: string }> = ({ output }) => {
  return <pre className="terminal-output">{output}</pre>;
};

export default TerminalOutput;
