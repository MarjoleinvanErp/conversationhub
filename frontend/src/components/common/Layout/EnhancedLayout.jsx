// frontend/src/components/common/Layout/EnhancedLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { generateColorCSS } from '../../../utils/colors.js';

// Sidebar Item Component
const SidebarItem = ({ item, isActive, level = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = level * 1.5 + 1; // rem units

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${paddingLeft}rem` }}
        className={`
          flex items-center justify-between py-2 px-3 mx-2 rounded-lg cursor-pointer
          transition-all duration-200 group
          ${isActive 
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
            : 'text-gray-700 hover:bg-gray-50'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{item.icon}</span>
          <span className="font-medium text-sm">{item.label}</span>
          
          {item.badge && (
            <span className={`
              px-2 py-1 text-xs rounded-full
              ${item.badge.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                item.badge.type === 'success' ? 'bg-green-100 text-green-800' : 
                'bg-blue-100 text-blue-800'
              }
            `}>
              {item.badge.count}
            </span>
          )}
        </div>
        
        {hasChildren && (
          <span className={`transform transition-transform text-xs ${isExpanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              isActive={location.pathname === child.path}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Quick Stats Component
const QuickStats = () => (
  <div className="modern-card p-4 m-4">
    <h3 className="font-semibold text-sm text-gray-700 mb-3">Vandaag</h3>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Gesprekken</span>
        <span className="font-semibold">5</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Uren gesprek</span>
        <span className="font-semibold">3.2u</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Privacy filters</span>
        <span className="font-semibold text-green-600">12 actief</span>
      </div>
    </div>
  </div>
);

// User Profile Section
const UserProfile = ({ user }) => (
  <div className="p-4 border-b border-gray-200">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
      <div>
        <p className="font-semibold text-sm">{user?.name || 'Gebruiker'}</p>
        <p className="text-xs text-gray-500">{user?.email || 'Gesprekscoördinator'}</p>
      </div>
    </div>
  </div>
);

// Navigation Items
const navigationItems = [
  { 
    id: 'dashboard', 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: '📊' 
  },
  {
    id: 'meetings',
    path: '/meetings',
    label: 'Gesprekken',
    icon: '📹',
    badge: { count: 3, type: 'success' },
    children: [
      { id: 'meetings-active', path: '/meetings/active', label: 'Actieve Gesprekken', icon: '🔴' },
      { id: 'meetings-scheduled', path: '/meetings/scheduled', label: 'Ingepland', icon: '📅' },
      { id: 'meetings-history', path: '/meetings/history', label: 'Geschiedenis', icon: '📋' }
    ]
  },
  { 
    id: 'participants', 
    path: '/participants', 
    label: 'Deelnemers', 
    icon: '👥',
    badge: { count: 12, type: 'info' }
  },
  {
    id: 'templates',
    path: '/templates',
    label: 'Sjablonen',
    icon: '📝',
    children: [
      { id: 'templates-intake', path: '/templates/intake', label: 'Intake Templates', icon: '📥' },
      { id: 'templates-progress', path: '/templates/progress', label: 'Voortgang Templates', icon: '📈' },
      { id: 'templates-custom', path: '/templates/custom', label: 'Aangepaste Templates', icon: '🔧' }
    ]
  }
];

const managementItems = [
  { 
    id: 'settings', 
    path: '/settings', 
    label: 'Instellingen', 
    icon: '⚙️' 
  }
];

// Main Layout Component
const EnhancedLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Inject color CSS variables
  useEffect(() => {
    const colorCSS = generateColorCSS();
    const styleElement = document.createElement('style');
    styleElement.textContent = colorCSS;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header - Fixed Height */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-30" style={{ height: '64px' }}>
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <span className="text-lg">☰</span>
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">ConversationHub</span>
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/meetings/create')}
            className="btn-primary px-4 py-2 text-sm"
          >
            <span className="hidden sm:inline">📹 Nieuw Gesprek</span>
            <span className="sm:hidden">📹</span>
          </button>
          
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <span className="text-lg">🔔</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:block text-sm text-gray-600 hover:text-gray-900"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Below Header */}
      <div className="flex" style={{ paddingTop: '64px', minHeight: 'calc(100vh - 64px)' }}>
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
            style={{ top: '64px' }}
          />
        )}
        
        {/* Sidebar - Fixed Position */}
        <div className={`
          bg-white border-r border-gray-200 flex flex-col
          fixed lg:relative z-50
          lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-300 ease-in-out
        `}
        style={{ 
          width: '280px', 
          height: 'calc(100vh - 64px)',
          top: '64px',
          left: '0'
        }}>
          {/* User Profile */}
          <UserProfile user={user} />
          
          {/* Quick Stats */}
          <QuickStats />
          
          {/* Navigation */}
          <div className="flex-1 px-2 overflow-y-auto">
            {/* Main Navigation */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Hoofdmenu
              </h2>
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </div>
            </div>

            {/* Management Section */}
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Beheer
              </h2>
              <div className="space-y-1">
                {managementItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">v1.0.0</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Beta</span>
            </div>
            <p className="text-xs text-gray-400">© 2025 ConversationHub</p>
          </div>
        </div>

        {/* Main Content Area - Adjust for Sidebar */}
        <main 
          className="flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300"
          style={{ 
            marginLeft: window.innerWidth >= 1024 ? '280px' : '0',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedLayout;