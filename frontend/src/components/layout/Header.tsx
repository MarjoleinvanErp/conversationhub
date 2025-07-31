// ConversationHub - Modern Header Component
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  showUserMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title = "ConversationHub", 
  showUserMenu = true 
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">
                {title}
              </h1>
            </div>
          </div>

          {/* User Menu */}
          {showUserMenu && user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welkom, {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;