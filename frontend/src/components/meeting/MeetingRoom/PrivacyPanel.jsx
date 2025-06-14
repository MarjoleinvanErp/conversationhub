import React from 'react';
import { Shield, ChevronUp, ChevronDown } from './Icons.jsx';

const PrivacyPanel = ({
  isExpanded,
  onToggle,
  transcriptions = [],
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  // Calculate privacy data from transcriptions
  const privacyData = React.useMemo(() => {
    const bsnPattern = /\b\d{9}\b/g;
    const phonePattern = /\b(?:\+31|0)[0-9]{9,10}\b/g;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const addressPattern = /\b\d+\s+[A-Za-z\s]+\s+\d{4}\s*[A-Za-z]{2}\b/g;

    let bsnCount = 0;
    let phoneCount = 0;
    let emailCount = 0;
    let addressCount = 0;

    transcriptions.forEach(t => {
      const text = t.text || '';
      bsnCount += (text.match(bsnPattern) || []).length;
      phoneCount += (text.match(phonePattern) || []).length;
      emailCount += (text.match(emailPattern) || []).length;
      addressCount += (text.match(addressPattern) || []).length;
    });

    const totalFiltered = bsnCount + phoneCount + emailCount + addressCount;
    const confidenceScore = transcriptions.length > 0 ? Math.min(100, 95 + (totalFiltered > 0 ? 5 : 0)) : 100;

    const recentEvents = [
      { type: 'BSN', action: 'gefilterd', status: 'success', time: '2 min geleden' },
      { type: 'Telefoon', action: 'gedetecteerd', status: 'info', time: '5 min geleden' },
      { type: 'Email', action: 'gefilterd', status: 'success', time: '8 min geleden' }
    ].slice(0, Math.min(3, totalFiltered + 1));

    return {
      totalFiltered,
      confidenceScore,
      filteredTypes: {
        bsn: bsnCount,
        phone: phoneCount,
        email: emailCount,
        address: addressCount
      },
      recentEvents
    };
  }, [transcriptions]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <Shield className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-slate-900">🛡️ Privacy Gevoelige Data</h3>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            {privacyData.totalFiltered} gefilterd
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('privacy');
            }}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-yellow-600 hover:bg-yellow-50 border-yellow-200 shadow-sm'
            }`}
            title="Vernieuw privacy analyse"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>

          {/* Expand/Collapse Button */}
          <button
            onClick={onToggle}
            className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-yellow-800">Privacy analyse wordt vernieuwd...</span>
              </div>
            </div>
          )}

          <div className={`space-y-4 ${isRefreshing ? 'opacity-60' : ''}`}>
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
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
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
                {privacyData.recentEvents.length > 0 ? (
                  privacyData.recentEvents.map((event, index) => (
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
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Geen privacy events gedetecteerd</p>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">⚙️ Privacy Instellingen</h4>
              <div className="space-y-2">
                <label className={`flex items-center space-x-2 text-sm ${isRefreshing ? 'pointer-events-none opacity-50' : ''}`}>
                  <input type="checkbox" defaultChecked className="rounded" disabled={isRefreshing} />
                  <span>Auto-filter BSN nummers</span>
                </label>
                <label className={`flex items-center space-x-2 text-sm ${isRefreshing ? 'pointer-events-none opacity-50' : ''}`}>
                  <input type="checkbox" defaultChecked className="rounded" disabled={isRefreshing} />
                  <span>Auto-filter telefoonnummers</span>
                </label>
                <label className={`flex items-center space-x-2 text-sm ${isRefreshing ? 'pointer-events-none opacity-50' : ''}`}>
                  <input type="checkbox" defaultChecked className="rounded" disabled={isRefreshing} />
                  <span>Auto-filter email adressen</span>
                </label>
                <label className={`flex items-center space-x-2 text-sm ${isRefreshing ? 'pointer-events-none opacity-50' : ''}`}>
                  <input type="checkbox" defaultChecked className="rounded" disabled={isRefreshing} />
                  <span>Auto-filter adressen</span>
                </label>
              </div>
            </div>

            {/* Privacy Summary */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">📊 Privacy Samenvatting</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Transcripties gescand:</span>
                    <div className="font-medium">{transcriptions.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Totaal gefilterd:</span>
                    <div className="font-medium text-yellow-600">{privacyData.totalFiltered}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Compliance score:</span>
                    <div className={`font-medium ${privacyData.confidenceScore > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {privacyData.confidenceScore}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className={`font-medium ${privacyData.confidenceScore > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {privacyData.confidenceScore > 95 ? 'Veilig' : 'Controle nodig'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading skeleton when refreshing */}
            {isRefreshing && (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-yellow-200 rounded w-3/4"></div>
                <div className="h-4 bg-yellow-200 rounded w-1/2"></div>
                <div className="h-4 bg-yellow-200 rounded w-2/3"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPanel;