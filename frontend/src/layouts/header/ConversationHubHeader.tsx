import React, { useState } from 'react';

// ConversationHub Logo Component
const ConversationHubLogo = () => (
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 modern-card flex items-center justify-center gradient-text font-bold text-lg">
      CH
    </div>
    <div>
      <h1 className="text-xl font-bold text-gray-900">
        ConversationHub
      </h1>
      <p className="text-xs text-gray-500">
        Intelligente Gespreksondersteuning
      </p>
    </div>
  </div>
);

// Status Indicators
const StatusIndicators = () => (
  <div className="hidden md:flex items-center space-x-4">
    <div className="status-badge status-active">
      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      Live Gesprek - 3 deelnemers
    </div>
    <div className="status-badge status-scheduled">
      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
      AVG Compliant
    </div>
  </div>
);

// Notifications Menu
const NotificationsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-neutral relative"
      >
        🔔
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          2
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 modern-card p-4 z-50">
          <h3 className="font-semibold mb-3">Meldingen</h3>
          <div className="space-y-3">
            <div className="p-3 glass-card">
              <p className="font-medium text-sm">Gesprek voltooid</p>
              <p className="text-xs text-gray-500">Het gesprek met Maria is succesvol afgerond</p>
            </div>
            <div className="p-3 glass-card">
              <p className="font-medium text-sm">Privacy filter actief</p>
              <p className="text-xs text-gray-500">3 gevoelige data punten automatisch gefilterd</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// User Menu
const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover-lift"
      >
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
          JD
        </div>
        <span className="hidden md:block text-sm font-medium">Jan van Der Berg</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 modern-card p-2 z-50">
          <div className="p-2 border-b border-gray-100">
            <p className="font-semibold text-sm">Jan van Der Berg</p>
            <p className="text-xs text-gray-500">Gesprekscoördinator</p>
          </div>
          <div className="py-2">
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded">
              Instellingen
            </button>
            <button className="w-full text-left px-2 py-1 text-sm hover:bg-gray-50 rounded">
              Privacy Instellingen
            </button>
            <hr className="my-1" />
            <button className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
              Uitloggen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Header Component
const ConversationHubHeader = () => {
  return (
    <header className="top-header bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Logo */}
      <ConversationHubLogo />
      
      {/* Status Indicators */}
      <StatusIndicators />
      
      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        <button className="btn-primary hidden md:block">
          📹 Nieuw Gesprek
        </button>
        
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
};

export default ConversationHubHeader;