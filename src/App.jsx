import React from 'react';
import { NhostApolloProvider } from '@nhost/react-apollo';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticationStatus } from '@nhost/react';
import nhost from './nhost';
import Login from './Login';
import Dashboard from './Dashboard';

// Unified private route for authenticated access
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Main application component with routing
export default function App() {
  return (
    <NhostApolloProvider nhost={nhost}>
      <Router>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />
          {/* Protected dashboard route */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </NhostApolloProvider>
  );
}