import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

// مكون الحماية للصفحات المحمية
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>جاري التحميل...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

// المكون الرئيسي للتطبيق
export default function App() {
  return (
    <BrowserRouter basename="/QuantumSafe">
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <Routes>
          {/* صفحة تسجيل الدخول */}
          <Route path="/login" element={<Login />} />
          
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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}