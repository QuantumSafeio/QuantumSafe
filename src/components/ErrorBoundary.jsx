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
    console.error('خطأ في التطبيق:', error, errorInfo);
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
              ⚠️ خطأ في التطبيق
            </h1>
            <p style={{
              color: '#ffffff',
              fontSize: '16px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              حدث خطأ ما. يرجى المحاولة مرة أخرى أو إعادة تحميل الصفحة.
            </p>
            <details style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                تفاصيل الخطأ
              </summary>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.3)',
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
                background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;