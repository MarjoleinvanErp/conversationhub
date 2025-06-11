import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

// Navigation Items
const navigationItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '📊',
    path: '/',
    badge: null,
  },
  {
    id: 'meetings',
    title: 'Gesprekken',
    icon: '📹',
    path: '/meetings',
    badge: { count: 3, type: 'primary' },
    children: [
      { id: 'active-meetings', title: 'Actieve Gesprekken', path: '/meetings/active', icon: '🎙️' },
      { id: 'scheduled-meetings', title: 'Geplande Gesprekken', path: '/meetings/scheduled', icon: '📅' },
      { id: 'meeting-history', title: 'Geschiedenis', path: '/meetings/history', icon: '📚' },
    ],
  },
  {
    id: 'participants',
    title: 'Deelnemers',
    icon: '👥',
    path: '/participants',
    badge: null,
  },
  {
    id: 'templates',
    title: 'Sjablonen',
    icon: '📝',
    path: '/templates',
    badge: null,
    children: [
      { id: 'intake-templates', title: 'Intake Gesprekken', path: '/templates/intake', icon: '📋' },
      { id: 'progress-templates', title: 'Voortgang Reviews', path: '/templates/progress', icon: '📈' },
      { id: 'custom-templates', title: 'Aangepaste Sjablonen', path: '/templates/custom', icon: '🔧' },
    ],
  },
];

const managementItems = [
  {
    id: 'reports',
    title: 'Rapporten & Export',
    icon: '📄',
    path: '/reports',
    badge: null,
  },
  {
    id: 'privacy',
    title: 'Privacy & Compliance',
    icon: '🛡️',
    path: '/privacy',
    badge: { count: 'AVG', type: 'success' },
  },
  {
    id: 'settings',
    title: 'Instellingen',
    icon: '⚙️',
    path: '/settings',
    badge: null,
  },
];

// Sidebar Item Component
const SidebarItem = ({ item, isActive, level = 0 }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const location = useLocation();

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const isChildActive = hasChildren && item.children.some((child: any) => 
    location.pathname === child.path
  );

  const itemClass = `
    nav-item flex items-center justify-between p-3 rounded-xl cursor-pointer
    ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}
    ${level > 0 ? 'ml-4 text-sm' : ''}
  `;

  return (
    <div className="mb-1">
      <div
        className={itemClass}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{item.icon}</span>
          {hasChildren ? (
            <span className="font-medium">{item.title}</span>
          ) : (
            <Link to={item.path} className="font-medium flex-1">
              {item.title}
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {item.badge && (
            <span className={`status-badge ${
              item.badge.type === 'primary' ? 'status-scheduled' :
              item.badge.type === 'success' ? 'status-active' : 'status-completed'
            }`}>
              {item.badge.count}
            </span>
          )}
          
          {hasChildren && (
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-1">
          {item.children.map((child: any) => (
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
const UserProfile = () => (
  <div className="sidebar-user p-4">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
        JD
      </div>
      <div>
        <p className="font-semibold text-sm">Jan van Der Berg</p>
        <p className="text-xs text-gray-500">Gesprekscoördinator</p>
      </div>
    </div>
  </div>
);

// Main Sidebar Component
const ConversationHubSidebar = ({ isOpen, onClose }: any) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        sidebar-nav bg-white border-r border-gray-200 flex flex-direction-column
        fixed lg:relative z-50 h-full
        ${isOpen ? 'expanded' : 'collapsed lg:expanded'}
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
      `}>
        {/* User Profile */}
        <UserProfile />
        
        {/* Quick Stats */}
        <QuickStats />
        
        {/* Navigation */}
        <div className="flex-1 px-4 overflow-y-auto">
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
        <div className="p-4 border-t border-gray-200 text-center">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">v1.0.0</span>
            <span className="status-badge status-scheduled text-xs">Beta</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">© 2025 ConversationHub</p>
        </div>
      </div>
    </>
  );
};

export default ConversationHubSidebar;