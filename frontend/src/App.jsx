import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import contexts
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Import components
import Layout from './components/common/Layout/Layout.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Login from './pages/auth/Login.jsx';
import CreateMeeting from './pages/meeting/CreateMeeting.jsx';
import MeetingRoom from './pages/meeting/MeetingRoom.jsx';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-conversation-muted">Laden...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="meetings/create" element={<CreateMeeting />} />
              <Route path="meetings/:id/room" element={<MeetingRoom />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;