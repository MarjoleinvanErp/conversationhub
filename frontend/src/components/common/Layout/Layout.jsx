import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { generateColorCSS } from '../../../utils/colors.js';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/meetings/create', label: 'Nieuw Gesprek' },
    { path: '/transcription/live', label: 'Directe Transcriptie' },
    { path: '/meetings', label: 'Alle Gesprekken' },
    { path: '/settings', label: 'Instellingen' },
  ];

  const isActivePath = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Links */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                ConversationHub
              </h1>
            </div>

            {/* Navigation Menu - Simpel horizontaal */}
            <nav className="flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Account Section - Rechts */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* User Info */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  {/* User Avatar */}
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900 ml-4"
                  >
                    Uitloggen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Nu correct onder het menu */}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;