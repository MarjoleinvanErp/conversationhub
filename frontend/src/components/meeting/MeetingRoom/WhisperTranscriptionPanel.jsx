import React from 'react';
import { Settings, Trash2, ChevronUp, ChevronDown } from './Icons.jsx';
import { formatTimestamp } from './utils/meetingUtils.js';

const WhisperTranscriptionPanel = ({
  isExpanded,
  onToggle,
  whisperTranscriptions,
  onDeleteTranscriptions
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 cursor-pointer hover:from-green-100 hover:to-green-150 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-slate-900">🤖 Whisper Transcriptie</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {whisperTranscriptions.length} items
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {whisperTranscriptions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTranscriptions('whisper');
              }}
              className="p-1 rounded hover:bg-red-100 text-red-600"
              title="Wis whisper transcripties"
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                      {entry.timestamp ? formatTimestamp(entry.timestamp) : 'Nu'}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Whisper
                    </span>
                    {entry.confidence && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{entry.text}</p>
                </div>
              </div>
            ))}
            {whisperTranscriptions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Geen Whisper transcripties</p>
                <p className="text-sm">Upload audiobestanden om Whisper transcripties te zien</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhisperTranscriptionPanel;