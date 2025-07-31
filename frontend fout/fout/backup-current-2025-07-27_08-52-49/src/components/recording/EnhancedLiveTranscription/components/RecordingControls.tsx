import React from 'react';
import { Box, Button, Tooltip, IconButton } from '@mui/material';
import { Mic, MicOff, Pause, PlayArrow, Stop } from '@mui/icons-material';
import type { RecordingControlsProps } from '../types';

/**
 * RecordingControls Component
 * Handles start/stop/pause/resume recording actions
 */
const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  sessionState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  disabled = false
}) => {
  /**
   * Get recording status text
   */
  const getStatusText = (): string => {
    if (recordingState.isRecording && recordingState.isPaused) {
      return 'Gepauzeerd';
    }
    if (recordingState.isRecording) {
      return 'Opname Actief';
    }
    return 'Klaar om op te nemen';
  };

  /**
   * Get status color
   */
  const getStatusColor = (): 'success' | 'warning' | 'info' => {
    if (recordingState.isRecording && recordingState.isPaused) {
      return 'warning';
    }
    if (recordingState.isRecording) {
      return 'success';
    }
    return 'info';
  };

  /**
   * Format recording time
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box className="modern-card p-6" data-testid="recording-controls">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium">🎤 Audio Opname</h3>
          <p className="text-sm text-gray-600 mt-1">
            Sessie: {sessionState.sessionId || 'Niet actief'}
          </p>
        </div>
        
        {/* Recording Status */}
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            getStatusColor() === 'success' ? 'bg-green-100 text-green-800' :
            getStatusColor() === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {getStatusText()}
          </div>
          {recordingState.isRecording && (
            <div className="text-2xl font-mono mt-2" data-testid="recording-timer">
              {formatTime(recordingState.recordingTime)}
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4">
        {!recordingState.isRecording ? (
          /* Start Recording Button */
          <Tooltip title="Start audio opname">
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Mic />}
              onClick={onStartRecording}
              disabled={disabled || !sessionState.sessionActive}
              sx={{ 
                px: 4, 
                py: 2,
                backgroundColor: '#10B981',
                '&:hover': {
                  backgroundColor: '#059669'
                }
              }}
              aria-label="Start audio opname"
              data-testid="start-recording-button"
            >
              Start Opname
            </Button>
          </Tooltip>
        ) : (
          <>
            {/* Pause/Resume Button */}
            <Tooltip title={recordingState.isPaused ? "Hervat opname" : "Pauzeer opname"}>
              <IconButton
                color="warning"
                size="large"
                onClick={recordingState.isPaused ? onResumeRecording : onPauseRecording}
                disabled={disabled}
                sx={{ 
                  backgroundColor: '#FEF3C7',
                  '&:hover': {
                    backgroundColor: '#FDE68A'
                  }
                }}
                aria-label={recordingState.isPaused ? "Hervat opname" : "Pauzeer opname"}
                data-testid={recordingState.isPaused ? "resume-recording-button" : "pause-recording-button"}
              >
                {recordingState.isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
            </Tooltip>

            {/* Stop Recording Button */}
            <Tooltip title="Stop opname">
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<Stop />}
                onClick={onStopRecording}
                disabled={disabled}
                sx={{ px: 4, py: 2 }}
                aria-label="Stop opname"
                data-testid="stop-recording-button"
              >
                Stop
              </Button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Recording Features Info */}
      {recordingState.isRecording && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${recordingState.speechSupported ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>Browser Speech Recognition</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Whisper API Verwerking</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {recordingState.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-sm text-red-700">{recordingState.error}</span>
          </div>
        </div>
      )}

      {/* Browser Support Warning */}
      {!recordingState.speechSupported && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-sm text-yellow-700">
              Browser Speech Recognition niet ondersteund. Alleen Whisper API transcriptie beschikbaar.
            </span>
          </div>
        </div>
      )}
    </Box>
  );
};

export default RecordingControls;