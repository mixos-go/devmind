import React from 'react';

export const CodeServerFrame: React.FC<{ src?: string }> = ({ src }) => {
  return (
    <iframe title="code-server" src={src} style={{ width: '100%', height: '100%' }} />
  );
};

export default CodeServerFrame;
