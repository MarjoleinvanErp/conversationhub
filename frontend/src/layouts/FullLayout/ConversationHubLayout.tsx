import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ConversationHubHeader from '../header/ConversationHubHeader';
import ConversationHubSidebar from '../sidebar/ConversationHubSidebar';

const ConversationHubLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <ConversationHubHeader />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ConversationHubSidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto main-content">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed bottom-4 right-4 z-40 btn-primary w-12 h-12 rounded-full shadow-lg"
      >
        ☰
      </button>
    </div>
  );
};

export default ConversationHubLayout;