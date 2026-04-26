import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Chat from './pages/Chat';
import { useAuthStore } from './store/useAuthStore'; // Import our store!
import Profile from './pages/Profile';
import Landing from './pages/Landing';

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  // This runs exactly once when the app first loads
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show a sleek loading screen while we verify their cookie
  if (isCheckingAuth && !authUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="glass-panel" style={{ padding: '20px', color: 'var(--accent-primary)' }}>Loading application...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(18, 18, 26, 0.8)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      />

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={!authUser ? <Landing /> : <Navigate to="/chat" />} />

        {/* Protected Routes */}
        <Route path="/chat" element={authUser ? <Chat /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
