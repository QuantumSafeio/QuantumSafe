import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
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
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '2px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px'
          }}>
            <h1 style={{
              color: '#ff4757',
              fontSize: '2rem',
              marginBottom: '20px'
            }}>
              ⚠️ Unexpected Error
            </h1>
            <p style={{
              color: '#ffffff',
              fontSize: '16px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Sorry, an error occurred in the application. Please reload the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
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