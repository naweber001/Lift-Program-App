import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 32, textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
          background: '#12121a', minHeight: '100vh', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#e8e8f0',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#8888a0', marginBottom: 24, maxWidth: 300 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '14px 28px', borderRadius: 14, border: 'none',
              background: '#5b9cf5', color: '#fff', fontSize: 16,
              fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: 12,
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => { localStorage.removeItem('se_v13'); window.location.reload(); }}
            style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #2a2a3a',
              background: 'transparent', color: '#8888a0', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Reset App Data
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
