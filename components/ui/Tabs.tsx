import React from 'react';

export const Tabs: React.FC = ({ children }) => {
  return <div role="tablist">{children}</div>;
};

export default Tabs;
