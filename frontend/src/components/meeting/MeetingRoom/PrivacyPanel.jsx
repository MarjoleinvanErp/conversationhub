import React from 'react';
import { Shield, ChevronUp, ChevronDown } from './Icons.jsx';

const PrivacyPanel = ({
  isExpanded,
  onToggle,
  privacyData
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 cursor-pointer hover:from-yellow-100 hover:to-yellow-150 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-slate-900">🛡️ Privacy Gevoelige Data</h3>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            {privacyData.totalFiltered} gefilterd
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-4">
            {/* Privacy Status */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">🔒 Privacy Status</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">AVG Compliance</span>
                    <span className="font-semibold text-green-600">{privacyData.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${privacyData.confidenceScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtered Data Types */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">🔍 Gefilterde Data Types</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">BSN Nummers</span>
                  <span className="font-medium">{privacyData.filteredTypes.bsn} gefilterd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefoonnummers</span>
                  <span className="font-medium">{privacyData.filteredTypes.phone} gefilterd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email adressen</span>
                  <span className="font-medium">{privacyData.filteredTypes.email} gefilterd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Adressen</span>
                  <span className="font-medium">{privacyData.filteredTypes.address} gefilterd</span>
                </div>
              </div>
            </div>

            {/* Recent Privacy Events */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">📝 Recente Privacy Events</h4>
              <div className="space-y-2">
                {privacyData.recentEvents.map((event, index) => (
                  <div key={index} className={`text-xs border rounded p-2 ${
                    event.status === 'success' ? 'bg-green-50 border-green-200' :
                    event.status === 'info' ? 'bg-blue-50 border-blue-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={
                        event.status === 'success' ? 'text-green-700' :
                        event.status === 'info' ? 'text-blue-700' :
                        'text-yellow-700'
                      }>
                        {event.type} {event.action}
                      </span>
                      <span className={
                        event.status === 'success' ? 'text-green-600' :
                        event.status === 'info' ? 'text-blue-600' :
                        'text-yellow-600'
                      }>
                        {event.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">⚙️ Privacy Instellingen</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Auto-filter BSN nummers</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Auto-filter telefoonnummers</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Auto-filter email adressen</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Auto-filter adressen</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPanel;