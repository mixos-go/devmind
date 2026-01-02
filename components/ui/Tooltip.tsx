import React from 'react';

export const Tooltip: React.FC<{ text: string }> = ({ text, children }) => {
  return (
    <span className="dm-tooltip">
      {children}
      <span className="dm-tooltip-text">{text}</span>
    </span>
  );
};

export default Tooltip;
