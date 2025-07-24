import React, { useState, useEffect, useCallback } from 'react';
import { Box, Alert, CircularProgress, Typography } from '@mui/material';
import configService from '@/services/configService';

// Components
import SessionSetup from './components/SessionSetup';
import RecordingControls from './components/RecordingControls';
import RecordingStatus from './components/RecordingStatus';
import TranscriptionOutput from './components/TranscriptionOutput';

// Hooks
import { useSessionManager } from './hooks/useSessionManager';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useTranscriptionProcessor } from './hooks/useTranscriptionProcessor';
import { useVoiceSetup } from './hooks/useVoiceSetup';

// Types
import type {
  EnhancedLiveTranscriptionProps,
  SessionConfig,
  LiveTranscription,
  SessionStats
} from './types';

/**
 * Enhanced Live Transcription Container
 * Main coordinator component that orchestrates all transcription functionality
 */
const EnhancedLiveTranscriptionContainer: React.FC<EnhancedLiveTranscriptionProps> = ({
  meetingId,
  conversationId,
  participants = [],
  onTranscriptionUpdate,
  onWhisperUpdate,
  onSessionStatsUpdate,
  autoStart = false,
  useVoiceSetup = false
}) => {
  // Use conversationId if provided, otherwise use meetingId
  const effectiveMeetingId = conversationId || meetingId;

  // Configuration state
  const [config, setConfig] = useState<SessionConfig>({
    live_webspeech_enabled: false,
    whisper_enabled: true,
    whisper_chunk_duration: 90,
    n8n_transcription_enabled: false,
    default_transcription_service: 'auto',
    available_services: {
      whisper: true,
      n8n: false
    }
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  // Transcription state
  const [transcriptions, setTranscriptions] = useState<LiveTranscription[]>([]);

  // Hooks initialization
  const { sessionState, startSession, stopSession, clearError: clearSessionError } = useSessionManager({
    meetingId: effectiveMeetingId,
    participants: participants || [],
    config
  });

  const { recordingState, startRecording, stopRecording, pauseRecording, resumeRecording, clearError: clearRecordingError } = useAudioRecorder({
    sessionId: sessionState.sessionId,
    onAudioChunk: useCallback((audioBlob: Blob) => {
      console.log('🎵 Audio chunk received:', audioBlob.size, 'bytes');
      processAudioChunk(audioBlob);
    }, []),
    chunkDuration: config.whisper_chunk_duration
  });

  const { 
    audioProcessingState, 
    sessionStats, 
    processAudioChunk, 
    resetStats, 
    clearError: clearProcessingError,
    updateDuration,
    cleanup: cleanupProcessor
  } = useTranscriptionProcessor({
    sessionId: sessionState.sessionId,
    config,
    onTranscriptionReceived: useCallback((transcription: LiveTranscription) => {
      setTranscriptions(prev => [transcription, ...prev]);
      onTranscriptionUpdate?.(transcription);
    }, [onTranscriptionUpdate]),
    onWhisperReceived: useCallback((transcription: LiveTranscription) => {
      // Update existing transcription or add new one
      setTranscriptions(prev => {
        const existingIndex = prev.findIndex(t => t.id === transcription.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = transcription;
          return updated;
        }
        return [transcription, ...prev];
      });
      onWhisperUpdate?.(transcription);
    }, [onWhisperUpdate])
  });

  const { 
    voiceSetupState, 
    startVoiceSetup, 
    recordVoiceProfile, 
    nextSpeaker, 
    skipVoiceSetup, 
    resetVoiceSetup, 
    clearError: clearVoiceError,
    stopVoiceRecording
  } = useVoiceSetup({
    participants,
    sessionId: sessionState.sessionId
  });

  /**
   * Load configuration on mount
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const transcriptionConfig = await configService.getTranscriptionConfig();
        setConfig(transcriptionConfig);
        setConfigLoaded(true);
        console.log('📋 Transcription config loaded:', transcriptionConfig);
      } catch (error) {
        console.error('❌ Failed to load transcription config:', error);
        setConfigLoaded(true); // Use defaults
      }
    };

    loadConfig();
  }, []);

  /**
   * Auto-start session if requested
   */
  useEffect(() => {
    if (configLoaded && autoStart && !sessionState.sessionActive && !sessionState.isStartingSession) {
      console.log('🚀 Auto-starting session...');
      handleStartSession(useVoiceSetup);
    }
  }, [configLoaded, autoStart, sessionState.sessionActive, sessionState.isStartingSession, useVoiceSetup]);

  /**
   * Update session stats callback
   */
  useEffect(() => {
    if (onSessionStatsUpdate) {
      onSessionStatsUpdate(sessionStats);
    }
  }, [sessionStats, onSessionStatsUpdate]);

  /**
   * Update duration from recording timer
   */
  useEffect(() => {
    if (recordingState.isRecording) {
      updateDuration(recordingState.recordingTime);
    }
  }, [recordingState.recordingTime, recordingState.isRecording, updateDuration]);

  /**
   * Handle session start
   */
  const handleStartSession = useCallback(async (withVoiceSetup: boolean = false) => {
    try {
      if (withVoiceSetup) {
        startVoiceSetup();
      }

      const result = await startSession(withVoiceSetup);
      
      if (result.success) {
        resetStats();
        setTranscriptions([]);
      }
    } catch (error) {
      console.error('❌ Failed to start session:', error);
    }
  }, [startSession, startVoiceSetup, resetStats]);

  /**
   * Handle session stop
   */
  const handleStopSession = useCallback(async () => {
    try {
      if (recordingState.isRecording) {
        await stopRecording();
      }
      
      // Stop voice recording if active
      if (voiceSetupState.isRecordingVoice) {
        stopVoiceRecording();
      }
      
      await stopSession();
      resetVoiceSetup();
      setTranscriptions([]);
      cleanupProcessor();
      
    } catch (error) {
      console.error('❌ Failed to stop session:', error);
    }
  }, [stopSession, stopRecording, recordingState.isRecording, resetVoiceSetup, voiceSetupState.isRecordingVoice, stopVoiceRecording, cleanupProcessor]);

  /**
   * Handle voice setup completion
   */
  const handleVoiceSetupComplete = useCallback(async () => {
    try {
      console.log('✅ Voice setup completed, starting recording...');
      await startRecording();
    } catch (error) {
      console.error('❌ Failed to start recording after voice setup:', error);
    }
  }, [startRecording]);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    clearSessionError();
    clearRecordingError();
    clearProcessingError();
    clearVoiceError();
  }, [clearSessionError, clearRecordingError, clearProcessingError, clearVoiceError]);

  /**
   * Get current error message
   */
  const getCurrentError = () => {
    return sessionState.error || 
           recordingState.error || 
           audioProcessingState.processingError || 
           voiceSetupState.voiceSetupError;
  };

  /**
   * Show loading state while config loads
   */
  if (!configLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading transcription configuration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="enhanced-live-transcription" sx={{ p: 2 }}>
      {/* Error Display */}
      {getCurrentError() && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearAllErrors}>
          {getCurrentError()}
        </Alert>
      )}

      {/* Session Setup */}
      {!sessionState.sessionActive && (
        <SessionSetup
          participants={participants}
          voiceSetupState={voiceSetupState}
          sessionState={sessionState}
          onStartSession={handleStartSession}
          onVoiceSetupNext={nextSpeaker}
          onVoiceSetupSkip={skipVoiceSetup}
          onRetry={() => handleStartSession(useVoiceSetup)}
        />
      )}

      {/* Recording Controls */}
      {sessionState.sessionActive && (
        <>
          <RecordingControls
            recordingState={recordingState}
            sessionState={sessionState}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
          />

          {/* Recording Status */}
          <RecordingStatus
            recordingState={recordingState}
            sessionStats={sessionStats}
            audioProcessingState={audioProcessingState}
            config={config}
          />

          {/* Transcription Output */}
          <TranscriptionOutput
            transcriptions={transcriptions}
            isLoading={audioProcessingState.isProcessingBackground}
            error={audioProcessingState.processingError}
            showConfidence={true}
            showSpeakerDetection={true}
          />
        </>
      )}

      {/* Session Stop Button */}
      {sessionState.sessionActive && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <button
            onClick={handleStopSession}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
          >
            Stop Session
          </button>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedLiveTranscriptionContainer;