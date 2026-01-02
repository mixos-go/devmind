import React from 'react';

export const MessageBubble: React.FC<{ role?: 'user' | 'assistant' }> = ({ role = 'user', children }) => {
  return <div className={`message-bubble ${role}`}>{children}</div>;
};

export default MessageBubble;
