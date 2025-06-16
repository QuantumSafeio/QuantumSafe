import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// مكون الحماية للصفحات المحمية
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="جاري التحقق من بيانات المستخدم..." />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

// مكون إعادة التوجيه للمستخدمين المسجلين
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="جاري التحقق من بيانات المستخدم..." />;
  }
  
  return user ? <Navigate to="/" replace /> : children;
}

// المكون الرئيسي للتطبيق
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/QuantumSafe">
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'Cairo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <Routes>
            {/* صفحة تسجيل الدخول */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* لوحة التحكم المحمية */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            {/* إعادة توجيه للصفحات غير الموجودة */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}