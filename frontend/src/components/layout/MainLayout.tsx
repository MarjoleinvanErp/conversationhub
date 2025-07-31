// ConversationHub - Main Layout Component
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

const sidebarItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Gesprekken', path: '/meetings', icon: '💬' },
  { label: 'Nieuw gesprek', path: '/meetings/create', icon: '➕' },
  { label: 'Deelnemers', path: '/participants', icon: '👥' },
  { label: 'Sjablonen', path: '/templates', icon: '📋' },
  { label: 'Instellingen', path: '/settings', icon: '⚙️' },
  { label: 'Test Components', path: '/test-existing', icon: '🧪' },
];

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showSidebar = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} />
      
      <div className="flex">
        {showSidebar && (
          <Sidebar items={sidebarItems} />
        )}
        
        <main className={`flex-1 ${showSidebar ? 'ml-0' : ''}`}>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;