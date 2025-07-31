import React from 'react';
import { Type } from './Icons.jsx';

const MeetingHeader = ({ 
  meeting, 
  isRecording, 
  recordingTime, 
  isAutoTranscriptionActive,
  onNavigateBack,
  formatTime 
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
              <p className="text-slate-600">

              </p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-4">
            {isRecording && (
              <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Opname actief: {formatTime(recordingTime)}</span>
              </div>
            )}
            
            {isAutoTranscriptionActive && (
              <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                <Type className="w-4 h-4" />
                <span className="font-medium">Auto-transcriptie actief</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingHeader;