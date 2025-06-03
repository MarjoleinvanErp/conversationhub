import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-conversation-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-conversation-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-conversation-text">
                ConversationHub
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-conversation-muted hover:text-conversation-text">
                Dashboard
              </a>
              <a href="/meetings" className="text-conversation-muted hover:text-conversation-text">
                Meetings
              </a>
              <a href="/settings" className="text-conversation-muted hover:text-conversation-text">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;