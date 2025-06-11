import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ConversationHubLayout from './layouts/FullLayout/ConversationHubLayout';
import ConversationHubDashboard from './views/dashboard/ConversationHubDashboard';
import './index.css';

// Placeholder components voor andere routes
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConversationHubLayout />}>
          <Route index element={<ConversationHubDashboard />} />
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
    </Router>
  );
}

export default App;