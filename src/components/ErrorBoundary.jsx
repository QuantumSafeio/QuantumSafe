import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f9fafb',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px'
          }}>
            <h1 style={{
              color: '#dc2626',
              fontSize: '2rem',
              marginBottom: '20px'
            }}>
              ⚠️ Application Error
            </h1>
            <p style={{
              color: '#111827',
              fontSize: '16px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Something went wrong. Please try refreshing the page.
            </p>
            <details style={{
              color: '#6b7280',
              fontSize: '12px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Error Details
              </summary>
              <pre style={{
                background: '#f3f4f6',
                padding: '10px',
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#6366f1',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;