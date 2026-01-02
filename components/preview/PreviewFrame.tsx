import React from 'react';

export const PreviewFrame: React.FC<{ src?: string }> = ({ src }) => {
  return <iframe title="preview" src={src} style={{ width: '100%', height: '100%' }} />;
};

export default PreviewFrame;
