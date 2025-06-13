import React from 'react';
import { Type, Trash2, ChevronUp, ChevronDown } from './Icons.jsx';
import { formatTimestamp } from './utils/meetingUtils.js';

const LiveTranscriptionPanel = ({
  isExpanded,
  onToggle,
  liveTranscriptions,
  isAutoTranscriptionActive,
  onDeleteTranscriptions
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isAutoTranscriptionActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <h3 className="font-semibold text-slate-900">🎤 Live Transcriptie</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {liveTranscriptions.length} items
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {liveTranscriptions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTranscriptions('live');
              }}
              className="p-1 rounded hover:bg-red-100 text-red-600"
              title="Wis live transcripties"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {/* Live Transcription History */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                      {entry.timestamp ? formatTimestamp(entry.timestamp) : 'Nu'}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Live
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
            {liveTranscriptions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Type className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Geen live transcripties</p>
                <p className="text-sm">Start auto-transcriptie om live tekst hier te zien</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTranscriptionPanel;