// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import contexts
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Import components
import EnhancedLayout from './components/common/Layout/EnhancedLayout.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Login from './pages/auth/Login.jsx';
import CreateMeeting from './pages/meeting/CreateMeeting.jsx';
import MeetingRoom from './pages/meeting/MeetingRoom.jsx';

// Placeholder components voor nieuwe routes
const MeetingsPage = () => (
  <div className="modern-card p-8">
    <h1 className="text-3xl font-bold gradient-text mb-4">Gesprekken</h1>
    <p className="text-gray-600">Hier komen je gesprekken te staan</p>
  </div>
);

const ParticipantsPage = () => (
  <div className="modern-card p-8">
    <h1 className="text-3xl font-bold gradient-text mb-4">Deelnemers</h1>
    <p className="text-gray-600">Hier komen de deelnemers te staan</p>
  </div>
);

const TemplatesPage = () => (
  <div className="modern-card p-8">
    <h1 className="text-3xl font-bold gradient-text mb-4">Sjablonen</h1>
    <p className="text-gray-600">Hier komen de gesprekssjablonen te staan</p>
  </div>
);

const SettingsPage = () => (
  <div className="modern-card p-8">
    <h1 className="text-3xl font-bold gradient-text mb-4">Instellingen</h1>
    <p className="text-gray-600">Hier komen de instellingen te staan</p>
  </div>
);

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
            
            {/* Protected routes met Enhanced Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <EnhancedLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="meetings/create" element={<CreateMeeting />} />
              <Route path="meetings/:id/room" element={<MeetingRoom />} />
              
              {/* Nieuwe routes */}
              <Route path="meetings" element={<MeetingsPage />} />
              <Route path="meetings/active" element={<MeetingsPage />} />
              <Route path="meetings/scheduled" element={<MeetingsPage />} />
              <Route path="meetings/history" element={<MeetingsPage />} />
              <Route path="participants" element={<ParticipantsPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="templates/intake" element={<TemplatesPage />} />
              <Route path="templates/progress" element={<TemplatesPage />} />
              <Route path="templates/custom" element={<TemplatesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;