import React from 'react';
import { Type, Trash2, ChevronUp, ChevronDown } from './Icons.jsx';
import { formatTimestamp } from './utils/meetingUtils.js';

const LiveTranscriptionPanel = ({
  isExpanded,
  onToggle,
  liveTranscriptions,
  isAutoTranscriptionActive,
  onDeleteTranscriptions,
  isDeleting = false,
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <div className={`w-3 h-3 rounded-full ${isAutoTranscriptionActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <h3 className="font-semibold text-slate-900">🎤 Live Transcriptie</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {liveTranscriptions.length} items
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Delete Button */}
          {liveTranscriptions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTranscriptions('live');
              }}
              disabled={isDeleting || isRefreshing}
              className={`p-1 rounded hover:bg-red-100 text-red-600 transition-colors ${
                (isDeleting || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Wis live transcripties"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('liveTranscription');
            }}
            disabled={isRefreshing || isDeleting}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing || isDeleting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200 shadow-sm'
            }`}
            title="Vernieuw live transcripties"
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
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-800">Live transcripties worden vernieuwd...</span>
              </div>
            </div>
          )}

          {/* Delete Status Indicator */}
          {isDeleting && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-red-800">Live transcripties worden verwijderd...</span>
              </div>
            </div>
          )}

          {/* Live Transcription History */}
          <div className={`space-y-3 max-h-96 overflow-y-auto ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
            {liveTranscriptions.map((entry) => (
              <div key={entry.id} className="flex space-x-3 p-3 rounded-lg hover:bg-blue-50 border border-blue-100">
                <div className="flex-shrink-0">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: entry.speakerColor || entry.speaker_color || '#3B82F6' }}
                  >
                    {(entry.speaker || entry.speaker_name || 'S').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-slate-900">{entry.speaker || entry.speaker_name}</span>
                    <span className="text-xs text-slate-500">
                      {entry.timestamp ? formatTimestamp(entry.timestamp) : 
                       entry.created_at ? formatTimestamp(entry.created_at) : 'Nu'}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Live
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
            
            {liveTranscriptions.length === 0 && !isRefreshing && (
              <div className="text-center py-8 text-slate-500">
                <Type className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Geen live transcripties</p>
                <p className="text-sm">Start auto-transcriptie om live tekst hier te zien</p>
              </div>
            )}

            {/* Loading skeleton when refreshing and no data */}
            {isRefreshing && liveTranscriptions.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-3 p-3 rounded-lg border border-blue-100 animate-pulse">
                    <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-blue-200 rounded w-20"></div>
                        <div className="h-3 bg-blue-100 rounded w-16"></div>
                      </div>
                      <div className="h-4 bg-blue-100 rounded w-full"></div>
                      <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-transcription Status */}
          {isAutoTranscriptionActive && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-800 font-medium">Auto-transcriptie actief</span>
                <span className="text-xs text-blue-600">Nieuwe transcripties verschijnen automatisch</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveTranscriptionPanel;