import React from 'react';
import { Settings, Trash2, ChevronUp, ChevronDown } from './Icons.jsx';
import { formatTimestamp } from './utils/meetingUtils.js';

const WhisperTranscriptionPanel = ({
  isExpanded,
  onToggle,
  whisperTranscriptions,
  onDeleteTranscriptions,
  isDeleting = false,
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-slate-900">🤖 Whisper Transcriptie</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {whisperTranscriptions.length} items
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Delete Button */}
          {whisperTranscriptions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTranscriptions('whisper');
              }}
              disabled={isDeleting || isRefreshing}
              className={`p-1 rounded hover:bg-red-100 text-red-600 transition-colors ${
                (isDeleting || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Wis whisper transcripties"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('whisperTranscription');
            }}
            disabled={isRefreshing || isDeleting}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing || isDeleting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-green-600 hover:bg-green-50 border-green-200 shadow-sm'
            }`}
            title="Vernieuw Whisper transcripties"
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
            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-green-800">Whisper transcripties worden vernieuwd...</span>
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
                <span className="text-sm text-red-800">Whisper transcripties worden verwijderd...</span>
              </div>
            </div>
          )}

          {/* Whisper Transcription History */}
          <div className={`space-y-3 max-h-96 overflow-y-auto ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
            {whisperTranscriptions.map((entry) => (
              <div key={entry.id} className="flex space-x-3 p-3 rounded-lg hover:bg-green-50 border border-green-100">
                <div className="flex-shrink-0">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: entry.speakerColor || entry.speaker_color || '#10B981' }}
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
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Whisper
                    </span>
                    {entry.confidence && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {Math.round(parseFloat(entry.confidence) * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{entry.text}</p>
                </div>
              </div>
            ))}
            
            {whisperTranscriptions.length === 0 && !isRefreshing && (
              <div className="text-center py-8 text-slate-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Geen Whisper transcripties</p>
                <p className="text-sm">Upload audiobestanden om Whisper transcripties te zien</p>
              </div>
            )}

            {/* Loading skeleton when refreshing and no data */}
            {isRefreshing && whisperTranscriptions.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-3 p-3 rounded-lg border border-green-100 animate-pulse">
                    <div className="w-8 h-8 bg-green-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-green-200 rounded w-20"></div>
                        <div className="h-3 bg-green-100 rounded w-16"></div>
                        <div className="h-3 bg-green-100 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-10"></div>
                      </div>
                      <div className="h-4 bg-green-100 rounded w-full"></div>
                      <div className="h-4 bg-green-100 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Whisper Statistics */}
          {whisperTranscriptions.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-200 ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
              <h4 className="font-medium text-gray-700 mb-3">📊 Whisper Statistieken</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Totaal transcripties:</span>
                  <div className="font-medium">{whisperTranscriptions.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Gemiddelde betrouwbaarheid:</span>
                  <div className="font-medium">
                    {whisperTranscriptions.length > 0 ? Math.round(
                      whisperTranscriptions
                        .filter(t => t.confidence)
                        .reduce((sum, t) => sum + parseFloat(t.confidence), 0) / 
                      whisperTranscriptions.filter(t => t.confidence).length * 100
                    ) : 0}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Laatste update:</span>
                  <div className="font-medium text-xs">
                    {whisperTranscriptions.length > 0 && whisperTranscriptions[0].created_at 
                      ? formatTimestamp(whisperTranscriptions[0].created_at)
                      : 'Onbekend'
                    }
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="font-medium text-green-600">Actief</div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Indicator */}
          {whisperTranscriptions.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-200 ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
              <h5 className="font-medium text-gray-700 mb-2">🎯 Kwaliteit Indicator</h5>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Transcriptie Kwaliteit</span>
                  <span className="text-sm font-medium text-green-600">
                    {whisperTranscriptions.filter(t => t.confidence && parseFloat(t.confidence) > 0.9).length} van {whisperTranscriptions.length} hoge kwaliteit
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${whisperTranscriptions.length > 0 ? 
                        (whisperTranscriptions.filter(t => t.confidence && parseFloat(t.confidence) > 0.9).length / whisperTranscriptions.length * 100) : 0
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhisperTranscriptionPanel;