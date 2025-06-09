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
    <div className="min-h-screen bg-gray-50">
      {/* Clean White Header */}
      <header className="glass-container mx-4 mt-4 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold gradient-text">
                  ConversationHub
                </h1>
                <p className="text-sm text-gray-600">Intelligente Gespreksondersteuning</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                    isActivePath(item.path)
                      ? 'btn-primary text-white'
                      : 'btn-neutral text-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    Welkom, {user.name}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="btn-neutral text-sm"
                >
                  Uitloggen
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden glass-container mx-4 mb-6">
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`p-3 rounded-lg text-center transition-all duration-300 ${
                  isActivePath(item.path)
                    ? 'btn-primary text-white'
                    : 'btn-neutral text-gray-700'
                }`}
              >
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-xs font-medium">{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="glass-card p-6 min-h-96">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;