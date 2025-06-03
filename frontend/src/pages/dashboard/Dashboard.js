import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welkom bij ConversationHub - Jouw intelligente gespreksondersteuning
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="conversation-button">
            Nieuw Gesprek
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">G</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Totaal Gesprekken
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  12
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">T</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Transcripties
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  45
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">P</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Privacy Filters
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  Active
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">E</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Exports
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  8
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="conversation-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recente Activiteit
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">
                Gesprek met participant 001 gestart
              </span>
            </div>
            <span className="text-xs text-gray-500">2 min geleden</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">
                Transcriptie voltooid
              </span>
            </div>
            <span className="text-xs text-gray-500">5 min geleden</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">
                Privacy filter toegepast
              </span>
            </div>
            <span className="text-xs text-gray-500">10 min geleden</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;