import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Global error handlers to capture runtime errors causing blank/black screen
window.addEventListener('error', (ev) => {
  // eslint-disable-next-line no-console
  console.error('[DevMind][window.error] ', ev.error || ev.message, ev.error?.stack);
});

window.addEventListener('unhandledrejection', (ev) => {
  // eslint-disable-next-line no-console
  console.error('[DevMind][unhandledrejection] ', ev.reason);
});

import ErrorBoundary from './components/ErrorBoundary';

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);