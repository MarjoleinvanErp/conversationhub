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
  formatTime
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-150 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <h3 className="font-semibold text-slate-900">🎤 Opname Meeting</h3>
          {isRecording && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6">
          {/* Recording Mode Selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Selecteer Opname Modus</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Handmatige Opname Option */}
              <button
                onClick={() => onSelectRecordingMode('manual')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  recordingMode === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
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
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  recordingMode === 'automatic'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
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
            <div className="border-t pt-6">
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
                  <button onClick={onStartManualRecording} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    Start Handmatige Opname
                  </button>
                ) : (
                  <>
                    <button onClick={onPauseRecording} className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center">
                      <Pause className="w-4 h-4 mr-2" />
                      Pauzeer
                    </button>
                    <button onClick={onStopRecording} className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
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
                  disabled={isRecording}
                />
              </div>
            </div>
          )}

          {recordingMode === 'automatic' && (
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-800 mb-4">🤖 Enhanced Live Transcriptie</h4>
              <EnhancedLiveTranscription
                meetingId={meetingId}
                participants={meeting.participants || []}
                onTranscriptionUpdate={onLiveTranscriptionReceived}
                onSessionStatsUpdate={() => {}} // TODO: Add session stats handler
              />
            </div>
          )}

          {recordingMode === 'none' && (
            <div className="text-center py-8 text-gray-500">
              <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Selecteer een opname modus om te beginnen</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingPanel;