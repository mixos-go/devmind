import React from 'react';

export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return (
    <div {...props}>
      {children}
    </div>
  );
};

export default Panel;
