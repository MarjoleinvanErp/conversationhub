import React from 'react';
import { Users, ChevronUp, ChevronDown } from './Icons.jsx';

const SpeakerPanel = ({
  isExpanded,
  onToggle,
  currentSpeaker,
  setCurrentSpeaker,
  availableSpeakers,
  setAvailableSpeakers,
  speakerStats,
  getSpeakerColor,
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  const handleSpeakerChange = (speaker) => {
    if (!isRefreshing && setCurrentSpeaker) {
      setCurrentSpeaker(speaker);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <Users className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-slate-900">🎤 Actieve Spreker</h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            {availableSpeakers?.length || 0} sprekers
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('speaker');
            }}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-orange-600 hover:bg-orange-50 border-orange-200 shadow-sm'
            }`}
            title="Vernieuw spreker gegevens"
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
            className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
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
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-orange-800">Spreker gegevens worden vernieuwd...</span>
              </div>
            </div>
          )}

          {/* Speaker Selection */}
          <div className={`space-y-2 ${isRefreshing ? 'opacity-60' : ''}`}>
            {availableSpeakers && availableSpeakers.length > 0 ? (
              availableSpeakers.slice(0, 4).map((speaker, index) => (
                <button
                  key={speaker.id || index}
                  onClick={() => handleSpeakerChange(speaker)}
                  disabled={isRefreshing}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all text-sm ${
                    currentSpeaker === speaker
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  } ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getSpeakerColor ? getSpeakerColor(index) : '#6B7280' }}
                  >
                    {(speaker.displayName || speaker.name || speaker || 'S').charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-left font-medium">
                    {speaker.displayName || speaker.name || speaker || 'Onbekende Spreker'}
                  </span>
                  {speaker.role && (
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {speaker.role}
                    </span>
                  )}
                  {currentSpeaker === speaker && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Geen sprekers beschikbaar</p>
                <p className="text-xs text-gray-400">Voeg deelnemers toe aan het gesprek</p>
              </div>
            )}
          </div>

          {/* Speaker Stats */}
          {currentSpeaker && (
            <div className={`mt-4 pt-4 border-t border-gray-200 ${isRefreshing ? 'opacity-60' : ''}`}>
              <h4 className="font-medium text-gray-700 mb-2">📊 Spreker Info</h4>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getSpeakerColor ? getSpeakerColor(0) : '#6B7280' }}
                  >
                    {(currentSpeaker.displayName || currentSpeaker.name || currentSpeaker || 'S').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-blue-800">
                    {currentSpeaker.displayName || currentSpeaker.name || currentSpeaker}
                  </span>
                </div>
                <div className="text-xs text-blue-600">
                  <p>Rol: {currentSpeaker.role || 'Deelnemer'}</p>
                  <p>Status: {currentSpeaker.isActive ? 'Actief' : 'Inactief'}</p>
                  {currentSpeaker.isParticipant && (
                    <p>Type: Meeting deelnemer</p>
                  )}
                  {speakerStats && speakerStats[currentSpeaker] && (
                    <>
                      <p>Segmenten: {speakerStats[currentSpeaker].segments || 0}</p>
                      <p>Geschatte spreektijd: {Math.round(speakerStats[currentSpeaker].totalTime || 0)}s</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Speaker Statistics Summary */}
          {speakerStats && Object.keys(speakerStats).length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-200 ${isRefreshing ? 'opacity-60' : ''}`}>
              <h4 className="font-medium text-gray-700 mb-2">📈 Spreektijd Verdeling</h4>
              <div className="space-y-2">
                {Object.entries(speakerStats).slice(0, 3).map(([speaker, stats], index) => (
                  <div key={speaker} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getSpeakerColor ? getSpeakerColor(index) : '#6B7280' }}
                      ></div>
                      <span className="text-gray-700">{speaker}</span>
                    </div>
                    <div className="text-gray-500">
                      {stats.segments || 0} seg. · {Math.round(stats.totalTime || 0)}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {availableSpeakers && availableSpeakers.length > 4 && (
            <div className={`mt-3 pt-3 border-t border-gray-200 ${isRefreshing ? 'opacity-60' : ''}`}>
              <button 
                className={`w-full text-xs text-blue-600 hover:text-blue-800 transition-colors ${
                  isRefreshing ? 'cursor-not-allowed opacity-50' : ''
                }`}
                onClick={() => {
                  if (!isRefreshing) {
                    console.log('Show all speakers');
                  }
                }}
                disabled={isRefreshing}
              >
                Toon alle {availableSpeakers.length} sprekers →
              </button>
            </div>
          )}

          {/* Current Speaker Quick Switch */}
          <div className={`mt-4 pt-4 border-t border-gray-200 ${isRefreshing ? 'opacity-60' : ''}`}>
            <h5 className="font-medium text-gray-700 mb-2">⚡ Snel Wisselen</h5>
            <div className="flex space-x-2">
              {availableSpeakers && availableSpeakers.slice(0, 3).map((speaker, index) => (
                <button
                  key={speaker.id || index}
                  onClick={() => handleSpeakerChange(speaker)}
                  disabled={isRefreshing}
                  className={`flex-1 p-2 rounded-lg text-xs transition-colors ${
                    currentSpeaker === speaker
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {(speaker.displayName || speaker.name || speaker || 'S').charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton when refreshing */}
          {isRefreshing && (
            <div className="space-y-3 animate-pulse mt-4">
              <div className="h-4 bg-orange-200 rounded w-3/4"></div>
              <div className="h-4 bg-orange-200 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-orange-200 rounded flex-1"></div>
                <div className="h-8 bg-orange-200 rounded flex-1"></div>
                <div className="h-8 bg-orange-200 rounded flex-1"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeakerPanel;