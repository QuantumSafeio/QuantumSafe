الاستيراد React from 'react';
الاستيراد { BrowserRouter, {, متصفح, Navigate } from الطرق;
import { استخدام  اليوتاليوت  } from ' . useAuth } from './hooks/useAuth';
'/المكونات/التسجيلات' Login المكونات './components/Login'التسجيلات
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// مكون الطريق المحمي للصفحات الموثقة
وظيفة PrivateRoute({ الطريق }) (
  كونست { user, { المستخدم = useAuth();
  
  إذا (loading) {
    العودةالعودة <LoadingSpinner messageتحميل  رسالة />;
  }
  
  العودة user ? children : <Navigate to="/login" < />;
}

// Public route component for redirecting authenticated users
function PublicRoute({ children }) {
  كونست { user, المستخدم المستخدم = useAuth();
  
    إذا (تحميل) .    {
 العودة. <LoadingSpinner العودة="Checking user credentials..." />;
  }
  
  عودة المستخدم؟ عودة  المستخدم؟     :.... الأطفال؛: الأطفال؛to : الأطفال؛: الأطفال؛   Navigate to="/" replace /> : الأطفال؛<Navigate to="/" replace /> : children;
}

// Main App component
export default function App() {
  return (
    <خطأ>
      <متصفح basename="/QuantumSafe">
        <div style={{ 
          minالارتفاع: '100vh', 
          خلفية: اللون,
          color: '#ffffff',
          fontFamily: 'Cairo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <Routes>
            {/* صفحة تسجيل الدخول */}
            <Route 
              المسار="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* لوحة القيادة المحمية */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            {/* إعادة توجيه جميع الطرق الأخرى إلى المنزل */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}