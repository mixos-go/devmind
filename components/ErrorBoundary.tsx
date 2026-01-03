import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
    // Log to console for developer debugging
    // eslint-disable-next-line no-console
    console.error('[DevMind][ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children as React.ReactElement;

    const { error, info } = this.state;

    return (
      <div style={{
        background: '#0b0b0c',
        color: '#fff',
        padding: 24,
        height: '100vh',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <h1 style={{ color: '#f87171' }}>Application Error (DevMind)</h1>
        <p style={{ color: '#e5e7eb' }}>{error?.message}</p>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#9ca3af' }}>{info?.componentStack}</pre>
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 12px' }}>Reload</button>
      </div>
    );
  }
}
