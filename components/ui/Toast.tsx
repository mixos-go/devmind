import React from 'react';

export const Toast: React.FC<{ message: string }> = ({ message }) => {
  return <div className="dm-toast">{message}</div>;
};

export default Toast;
