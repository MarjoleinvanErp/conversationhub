import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { generateColorCSS } from '../../../utils/colors.js';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/meetings/create', label: 'Nieuw Gesprek', icon: '➕' },
    { path: '/meetings', label: 'Gesprekken', icon: '💬' },
    { path: '/settings', label: 'Instellingen', icon: '⚙️' },
  ];

  const isActivePath = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}>
        {/* Sidebar Toggle */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-xl">☰</span>
            {sidebarExpanded && (
              <span className="ml-2 text-sm font-medium text-gray-700">Menu</span>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                isActivePath(item.path)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!sidebarExpanded ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {sidebarExpanded && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Info in Sidebar - Bottom */}
        {sidebarExpanded && user && (
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-3 flex items-center justify-between">
            {/* Brand Name */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h1 className="text-xl font-bold gradient-text">
                ConversationHub
              </h1>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Desktop User Info */}
                  <div className="hidden md:flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span>🚪</span>
                    <span className="text-sm font-medium">Uitloggen</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full p-4">
            <div className="bg-white rounded-lg shadow-sm h-full overflow-auto">
              <div className="h-full">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation Overlay */}
      {sidebarExpanded && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarExpanded(false)}
        />
      )}
    </div>
  );
};

export default Layout;