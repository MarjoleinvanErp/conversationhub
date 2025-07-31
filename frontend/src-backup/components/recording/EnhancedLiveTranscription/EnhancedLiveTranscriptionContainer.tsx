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
    }, [onTranscriptionUpdate])
  });

  // FIXED: Voice setup hook initialization
  const voiceSetupHook = (useVoiceSetup as any)({
    participants: participants || [],
    sessionId: sessionState.sessionId
  });

  // Extract voice setup functions and state
  const {
    voiceSetupState,
    startVoiceSetup,
    recordVoiceProfile,
    nextSpeaker,
    skipVoiceSetup,
    resetVoiceSetup,
    clearError: clearVoiceSetupError,
    stopVoiceRecording
  } = voiceSetupHook;

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await configService.getTranscriptionConfig();
        setConfig(configData);
        setConfigLoaded(true);
        console.log('📋 Transcription config loaded:', configData);
      } catch (error) {
        console.error('❌ Failed to load config:', error);
        setConfigLoaded(true); // Continue with defaults
      }
    };

    loadConfig();
  }, []);

  // Auto-start session if enabled
  useEffect(() => {
    if (configLoaded && autoStart && !sessionState.sessionActive && effectiveMeetingId) {
      console.log('🚀 Auto-starting session...');
      handleStartSession(useVoiceSetup);
    }
  }, [configLoaded, autoStart, sessionState.sessionActive, effectiveMeetingId, useVoiceSetup]);

  // Update session stats
  useEffect(() => {
    if (sessionStats && onSessionStatsUpdate) {
      onSessionStatsUpdate(sessionStats);
    }
  }, [sessionStats, onSessionStatsUpdate]);

  // Session management functions
  const handleStartSession = useCallback(async (useVoice: boolean = false) => {
    try {
      const result = await startSession(useVoice);
      if (result.success) {
        resetStats();
        if (useVoice && participants.length > 0) {
          startVoiceSetup();
        }
        console.log('✅ Session started successfully');
      } else {
        console.error('❌ Session start failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Session start exception:', error);
    }
  }, [startSession, resetStats, participants.length, startVoiceSetup]);

  const handleStopSession = useCallback(async () => {
    try {
      await stopRecording();
      await stopSession();
      cleanupProcessor();
      stopVoiceRecording();
      setTranscriptions([]);
      console.log('🛑 Session stopped');
    } catch (error) {
      console.error('❌ Session stop error:', error);
    }
  }, [stopRecording, stopSession, cleanupProcessor, stopVoiceRecording]);

  // Recording management functions
  const handleStartRecording = useCallback(async () => {
    if (!sessionState.sessionActive) {
      console.warn('⚠️ Cannot start recording: no active session');
      return;
    }

    try {
      await startRecording();
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Recording start failed:', error);
    }
  }, [sessionState.sessionActive, startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      await stopRecording();
      console.log('⏹️ Recording stopped');
    } catch (error) {
      console.error('❌ Recording stop failed:', error);
    }
  }, [stopRecording]);

  const handlePauseRecording = useCallback(async () => {
    try {
      await pauseRecording();
      console.log('⏸️ Recording paused');
    } catch (error) {
      console.error('❌ Recording pause failed:', error);
    }
  }, [pauseRecording]);

  const handleResumeRecording = useCallback(async () => {
    try {
      await resumeRecording();
      console.log('▶️ Recording resumed');
    } catch (error) {
      console.error('❌ Recording resume failed:', error);
    }
  }, [resumeRecording]);

  // Voice setup functions
  const handleVoiceSetupNext = useCallback(async () => {
    try {
      await nextSpeaker();
    } catch (error) {
      console.error('❌ Voice setup next failed:', error);
    }
  }, [nextSpeaker]);

  const handleVoiceSetupSkip = useCallback(() => {
    skipVoiceSetup();
  }, [skipVoiceSetup]);

  const handleRetry = useCallback(() => {
    clearSessionError();
    clearRecordingError();
    clearProcessingError();
    clearVoiceSetupError();
  }, [clearSessionError, clearRecordingError, clearProcessingError, clearVoiceSetupError]);

  // Error handling
  const hasError = sessionState.error || recordingState.error || audioProcessingState.processingError || voiceSetupState.voiceSetupError;

  // Loading state
  if (!configLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Laden van configuratie...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', p: 2 }}>
      {/* Error Display */}
      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={handleRetry}>
          <Typography variant="body2">
            {sessionState.error || recordingState.error || audioProcessingState.processingError || voiceSetupState.voiceSetupError}
          </Typography>
        </Alert>
      )}

      {/* Session Setup */}
      {!sessionState.sessionActive && (
        <SessionSetup
          participants={participants}
          voiceSetupState={voiceSetupState}
          sessionState={sessionState}
          onStartSession={handleStartSession}
          onVoiceSetupNext={handleVoiceSetupNext}
          onVoiceSetupSkip={handleVoiceSetupSkip}
          onRetry={handleRetry}
        />
      )}

      {/* Active Session Interface */}
      {sessionState.sessionActive && (
        <Box>
          {/* Recording Controls */}
          <RecordingControls
            recordingState={recordingState}
            sessionState={sessionState}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
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
            error={audioProcessingState.processingError || undefined}
            showConfidence={true}
            showSpeakerDetection={true}
          />
        </Box>
      )}
    </Box>
  );
};

export default EnhancedLiveTranscriptionContainer;