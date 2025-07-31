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
  meetingId,
  // Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  // Real-time status tracking
  const [processingStatus, setProcessingStatus] = useState('');
  const [realtimeTranscriptions, setRealtimeTranscriptions] = useState([]);
  const [lastDatabaseSync, setLastDatabaseSync] = useState(null);

  // Combine database and real-time transcriptions with deduplication
  const allTranscriptions = React.useMemo(() => {
    const combined = [
      ...realtimeTranscriptions.map(item => ({ ...item, source: 'realtime' })),
      ...whisperTranscriptions.map(item => ({ ...item, source: 'database' }))
    ];
    
    // Remove duplicates based on ID, preferring database entries
    const uniqueTranscriptions = [];
    const seenIds = new Set();
    
    // Sort by timestamp first
    const sorted = combined.sort((a, b) => 
      new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
    );
    
    for (const item of sorted) {
      const itemId = item.id;
      if (!seenIds.has(itemId)) {
        seenIds.add(itemId);
        uniqueTranscriptions.push(item);
      }
    }
    
    return uniqueTranscriptions;
  }, [realtimeTranscriptions, whisperTranscriptions]);

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
        console.log('✅ Database transcriptions refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to refresh database transcriptions:', error);
    }
  };

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
          <h3 className="font-semibold text-slate-900">Whisper Transcriptie</h3>
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
              stroke="currentColor" 
              viewBox="0 0 24 24"
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
          <button onClick={onToggle} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Content */}
      {isExpanded && (
        <div className={`p-4 space-y-3 max-h-96 overflow-y-auto ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
          {allTranscriptions.map((entry, index) => {
            const isRealtime = entry.source === 'realtime';
            
            // Create unique key using combination of source, id, and index
            const uniqueKey = `${entry.source || 'unknown'}-${entry.id || 'no-id'}-${index}`;
            
            return (
              <div 
                key={uniqueKey}
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
                <div key={`skeleton-${i}`} className="flex space-x-3 p-3 rounded-lg border border-green-100 animate-pulse">
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
      )}

      {/* Database Sync Status */}
      {isExpanded && lastDatabaseSync && (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>Laatste database sync:</span>
            <span>{lastDatabaseSync.toLocaleTimeString('nl-NL')}</span>
          </div>
        </div>
      )}

      {/* Enhanced Statistics */}
      {isExpanded && allTranscriptions.length > 0 && (
        <div className={`px-4 pb-4 border-t border-gray-200 ${(isRefreshing || isDeleting) ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-600 pt-2">
            <div>
              <div className="font-medium text-green-600">{whisperTranscriptions.length}</div>
              <div>Database</div>
            </div>
            <div>
              <div className="font-medium text-blue-600">{realtimeTranscriptions.length}</div>
              <div>Real-time</div>
            </div>
            <div>
              <div className="font-medium text-purple-600">{allTranscriptions.length}</div>
              <div>Totaal</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhisperTranscriptionPanel;