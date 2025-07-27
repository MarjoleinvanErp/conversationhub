import React from 'react';
import { Mic, Type, Play, Pause, Square, ChevronUp, ChevronDown } from './Icons.jsx';
import EnhancedLiveTranscription from '../../recording/EnhancedLiveTranscription.jsx';
import AudioUploadRecorder from '../../recording/AudioRecorder/AudioUploadRecorder.jsx';

const RecordingPanel = ({
  isExpanded,
  onToggle,
  recordingMode,
  onSelectRecordingMode,
  isRecording,
  recordingTime,
  recordingStartTime,
  onStartManualRecording,
  onStartAutoTranscription,
  onPauseRecording,
  onStopRecording,
  onLiveTranscriptionReceived,
  onWhisperTranscriptionReceived,
  meetingId,
  meeting,
  formatTime,
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <h3 className="font-semibold text-slate-900">🎤 Opname Meeting</h3>
          {isRecording && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('recording');
            }}
            disabled={isRefreshing || isRecording}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing || isRecording
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-red-600 hover:bg-red-50 border-red-200 shadow-sm'
            }`}
            title={isRecording ? 'Kan niet verversen tijdens opname' : 'Vernieuw meeting gegevens'}
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
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
        <div className="p-6">
          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-red-800">Meeting gegevens worden vernieuwd...</span>
              </div>
            </div>
          )}

          {/* Recording Mode Selection */}
          <div className={`mb-6 ${isRefreshing ? 'opacity-60' : ''}`}>
            <h4 className="font-medium text-gray-800 mb-3">Selecteer Opname Modus</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Handmatige Opname Option */}
              <button
                onClick={() => onSelectRecordingMode('manual')}
                disabled={isRefreshing || isRecording}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  recordingMode === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${(isRefreshing || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Mic className="w-5 h-5 text-gray-600" />
                  <h5 className="font-medium text-gray-800">Handmatige Opname</h5>
                </div>
                <p className="text-sm text-gray-600">
                  Start handmatige audio opname zonder automatische transcriptie
                </p>
              </button>

              {/* Automatische Opname Option */}
              <button
                onClick={() => onSelectRecordingMode('automatic')}
                disabled={isRefreshing || isRecording}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  recordingMode === 'automatic'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${(isRefreshing || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Type className="w-5 h-5 text-blue-600" />
                  <h5 className="font-medium text-gray-800">Automatische Opname</h5>
                </div>
                <p className="text-sm text-gray-600">
                  Start opname met automatische real-time transcriptie
                </p>
              </button>
            </div>
          </div>

          {/* Recording Content Based on Mode */}
          {recordingMode === 'manual' && (
            <div className={`border-t pt-6 ${isRefreshing ? 'opacity-60' : ''}`}>
              <h4 className="font-medium text-gray-800 mb-4">📁 Handmatige Audio Opname</h4>
              
              {/* Recording Status Display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-mono text-slate-800 mb-2">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-slate-600">
                  {isRecording ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Handmatige opname actief sinds {recordingStartTime ? recordingStartTime.toLocaleTimeString('nl-NL') : ''}</span>
                    </span>
                  ) : (
                    'Opname gestopt'
                  )}
                </div>
              </div>

              {/* Manual Recording Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                {!isRecording ? (
                  <button 
                    onClick={onStartManualRecording} 
                    disabled={isRefreshing}
                    className={`bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Handmatige Opname
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={onPauseRecording} 
                      className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pauzeer
                    </button>
                    <button 
                      onClick={onStopRecording} 
                      className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </button>
                  </>
                )}
              </div>

              {/* Audio Upload Component */}
              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-700 mb-3">Of upload een audio bestand:</h5>
                <AudioUploadRecorder
                  onTranscriptionReceived={onWhisperTranscriptionReceived}
                  meetingId={meetingId}
                  disabled={isRecording || isRefreshing}
                />
              </div>
            </div>
          )}

          {recordingMode === 'automatic' && (
            <div className={`border-t pt-6 ${isRefreshing ? 'opacity-60' : ''}`}>
              <EnhancedLiveTranscription
                meetingId={meetingId}
                participants={meeting?.participants || []}
                onTranscriptionUpdate={onLiveTranscriptionReceived}
				onWhisperUpdate={onWhisperTranscriptionReceived}		
                onSessionStatsUpdate={() => {}} // TODO: Add session stats handler
                disabled={isRefreshing}
              />
            </div>
          )}

          {(recordingMode === 'none' || !recordingMode) && (
            <div className={`text-center py-8 text-gray-500 ${isRefreshing ? 'opacity-60' : ''}`}>
              <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Selecteer een opname modus om te beginnen</p>
            </div>
          )}


          {/* Loading skeleton when refreshing */}
          {isRefreshing && (
            <div className="space-y-3 animate-pulse mt-4">
              <div className="h-4 bg-red-200 rounded w-3/4"></div>
              <div className="h-4 bg-red-200 rounded w-1/2"></div>
              <div className="h-4 bg-red-200 rounded w-2/3"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingPanel;