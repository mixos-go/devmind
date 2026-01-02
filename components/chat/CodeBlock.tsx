import React from 'react';

export const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  return <pre className="code-block">{code}</pre>;
};

export default CodeBlock;
