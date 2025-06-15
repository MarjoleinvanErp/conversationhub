import React, { useState, useEffect } from 'react';
import { Settings, Trash2, ChevronUp, ChevronDown } from './Icons.jsx';
import { formatTimestamp } from './utils/meetingUtils.js';
import enhancedLiveTranscriptionService from '../../../services/api/enhancedLiveTranscriptionService.js';

const WhisperTranscriptionPanel = ({
  isExpanded,
  onToggle,
  whisperTranscriptions,
  onDeleteTranscriptions,
  isDeleting = false,
  meetingId, // NIEUWE PROP
  // Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  // Real-time status tracking
  const [processingStatus, setProcessingStatus] = useState('');
  const [realtimeTranscriptions, setRealtimeTranscriptions] = useState([]);
  const [lastDatabaseSync, setLastDatabaseSync] = useState(null);

  // Combine database and real-time transcriptions
  const allTranscriptions = [
    ...realtimeTranscriptions,
    ...whisperTranscriptions
  ].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));

  // Auto-refresh database every 30 seconds when panel is expanded
  useEffect(() => {
    let refreshInterval;
    
    if (isExpanded && meetingId) {
      refreshInterval = setInterval(async () => {
        await refreshDatabaseTranscriptions();
      }, 30000); // 30 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isExpanded, meetingId]);

  // Refresh database transcriptions
  const refreshDatabaseTranscriptions = async () => {
    try {
      console.log('🔄 Auto-refreshing Whisper transcriptions from database...');
      
      const result = await enhancedLiveTranscriptionService.getWhisperTranscriptions(meetingId);
      
      if (result.success && onRefresh) {
        // Update the parent with fresh database data
        onRefresh('whisperTranscription', result.transcriptions);
        setLastDatabaseSync(new Date());
        
        console.log('✅ Database transcriptions refreshed:', {
          count: result.transcriptions.length,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('❌ Auto-refresh failed:', error);
    }
  };

  // Handle real-time Whisper updates
  const handleWhisperUpdate = (update) => {
    console.log('🤖 Whisper real-time update:', update);
    
    switch (update.type) {
      case 'processing_start':
        setProcessingStatus('🔄 Whisper verwerking gestart...');
        break;
        
      case 'transcription_completed':
        setProcessingStatus('');
        
        // Add to real-time list if it has database_saved flag
        if (update.transcription && update.transcription.database_saved) {
          setRealtimeTranscriptions(prev => {
            // Check if already exists
            const exists = prev.some(t => t.id === update.transcription.id);
            if (!exists) {
              return [update.transcription, ...prev.slice(0, 4)]; // Keep only 5 recent
            }
            return prev;
          });
          
          // Schedule database refresh in 2 seconds
          setTimeout(() => {
            refreshDatabaseTranscriptions();
          }, 2000);
        }
        break;
        
      case 'processing_error':
        setProcessingStatus(`❌ ${update.message}: ${update.error}`);
        setTimeout(() => setProcessingStatus(''), 5000);
        break;
        
      default:
        console.log('Unknown Whisper update type:', update.type);
    }
  };

  // Setup real-time callback on component mount
  useEffect(() => {
    enhancedLiveTranscriptionService.setWhisperUpdateCallback(handleWhisperUpdate);
    
    return () => {
      enhancedLiveTranscriptionService.setWhisperUpdateCallback(null);
    };
  }, []);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (onRefresh) {
      await onRefresh('whisperTranscription');
      await refreshDatabaseTranscriptions();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Status en Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-slate-900">🤖 Whisper Transcriptie</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {allTranscriptions.length} items
          </span>
          {realtimeTranscriptions.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
              {realtimeTranscriptions.length} live
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Processing Status Indicator */}
          {processingStatus && (
            <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {processingStatus}
            </div>
          )}

          {/* Delete Button */}
          {allTranscriptions.length > 0 && (
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
              handleManualRefresh();
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
          {/* Real-time Processing Status */}
          {processingStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-800">{processingStatus}</span>
              </div>
            </div>
          )}

          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-green-800">Database transcripties worden vernieuwd...</span>
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
            {allTranscriptions.map((entry, index) => {
              const isRealtime = realtimeTranscriptions.some(rt => rt.id === entry.id);
              
              return (
                <div 
                  key={entry.id || `entry-${index}`} 
                  className={`flex space-x-3 p-3 rounded-lg border transition-all duration-300 ${
                    isRealtime 
                      ? 'bg-blue-50 border-blue-200 animate-pulse' 
                      : 'hover:bg-green-50 border-green-100'
                  }`}
                >
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
                      
                      {/* Status Badges */}
                      <span className={`text-xs px-2 py-1 rounded ${
                        isRealtime ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isRealtime ? 'Live' : 'Whisper'}
                      </span>
                      
                      {entry.database_saved && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          💾 Opgeslagen
                        </span>
                      )}
                      
                      {entry.processing_status === 'whisper_processing' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded animate-pulse">
                          ⏳ Verwerken
                        </span>
                      )}
                      
                      {entry.confidence && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {Math.round(parseFloat(entry.confidence) * 100)}%
                        </span>
                      )}
                    </div>
                    <p className={`text-slate-700 leading-relaxed ${
                      isRealtime ? 'font-semibold' : 'font-medium'
                    }`}>
                      {entry.text}
                    </p>
                    
                    {/* Metadata for debugging */}
                    {entry.metadata && (
                      <div className="text-xs text-gray-500 mt-1">
                        Status: {entry.metadata.processing_status} | 
                        Chunk: {entry.metadata.chunk_number}
                        {entry.metadata.whisper_language && ` | Taal: ${entry.metadata.whisper_language}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {allTranscriptions.length === 0 && !isRefreshing && !processingStatus && (
              <div className="text-center py-8 text-slate-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Geen Whisper transcripties</p>
                <p className="text-sm">Audio chunks worden automatisch verwerkt</p>
              </div>
            )}

            {/* Loading skeleton when refreshing and no data */}
            {isRefreshing && allTranscriptions.length === 0 && (
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

          {/* Database Sync Status */}
          {lastDatabaseSync && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>Laatste database sync:</span>
                <span>{lastDatabaseSync.toLocaleTimeString('nl-NL')}</span>
              </div>
            </div>
          )}

          {/* Enhanced Statistics */}
          {allTranscriptions.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-200 ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
              <h4 className="font-medium text-gray-700 mb-3">📊 Whisper Statistieken</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Database transcripties:</span>
                  <div className="font-medium">{whisperTranscriptions.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Live transcripties:</span>
                  <div className="font-medium text-blue-600">{realtimeTranscriptions.length}</div>
                </div>
                <div>
                  <span className="text-gray-500">Totaal opgeslagen:</span>
                  <div className="font-medium text-purple-600">
                    {allTranscriptions.filter(t => t.database_saved).length}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Gemiddelde betrouwbaarheid:</span>
                  <div className="font-medium">
                    {allTranscriptions.length > 0 ? Math.round(
                      allTranscriptions
                        .filter(t => t.confidence)
                        .reduce((sum, t) => sum + parseFloat(t.confidence), 0) / 
                      allTranscriptions.filter(t => t.confidence).length * 100
                    ) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Indicator */}
          {allTranscriptions.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-gray-200 ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
              <h5 className="font-medium text-gray-700 mb-2">🎯 Kwaliteit & Status</h5>
              <div className="space-y-3">
                {/* Processing Quality */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Transcriptie Kwaliteit</span>
                    <span className="text-sm font-medium text-green-600">
                      {allTranscriptions.filter(t => t.confidence && parseFloat(t.confidence) > 0.9).length} van {allTranscriptions.length} hoge kwaliteit
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${allTranscriptions.length > 0 ? 
                          (allTranscriptions.filter(t => t.confidence && parseFloat(t.confidence) > 0.9).length / allTranscriptions.length * 100) : 0
                        }%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Database Storage Status */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Database Opslag</span>
                    <span className="text-sm font-medium text-purple-600">
                      {allTranscriptions.filter(t => t.database_saved).length} van {allTranscriptions.length} opgeslagen
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${allTranscriptions.length > 0 ? 
                          (allTranscriptions.filter(t => t.database_saved).length / allTranscriptions.length * 100) : 0
                        }%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Real-time Processing Status */}
                {processingStatus && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-700">Whisper processing actief</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhisperTranscriptionPanel;