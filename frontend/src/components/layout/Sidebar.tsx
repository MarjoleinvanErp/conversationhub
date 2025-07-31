// ConversationHub - Modern Sidebar Component
import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarItem {
  label: string;
  path: string;
  icon?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ items, className = '' }) => {
  return (
    <aside className={`w-64 bg-white border-r border-gray-200 shadow-sm ${className}`}>
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.icon && (
                  <span className="mr-3 text-lg">{item.icon}</span>
                )}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;