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
  participants,
  onTranscriptionUpdate,
  onWhisperUpdate,
  onSessionStatsUpdate,
  autoStart = false,
  useVoiceSetup = false
}) => {
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
    meetingId,
    participants,
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
      onWhisperReceived?.(transcription);
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
  const getCurrentError = (): string | null => {
    return sessionState.error || 
           recordingState.error || 
           audioProcessingState.processingError || 
           voiceSetupState.voiceSetupError || 
           null;
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (recordingState.isRecording) {
        stopRecording().catch(console.error);
      }
      
      if (voiceSetupState.isRecordingVoice) {
        stopVoiceRecording();
      }
      
      cleanupProcessor();
    };
  }, [recordingState.isRecording, voiceSetupState.isRecordingVoice, stopRecording, stopVoiceRecording, cleanupProcessor]);

  /**
   * Loading state
   */
  if (!configLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Configuratie laden...</Typography>
      </Box>
    );
  }

  /**
   * Error state
   */
  const currentError = getCurrentError();

  return (
    <Box className="enhanced-live-transcription space-y-6">
      {/* Error Display */}
      {currentError && (
        <Alert 
          severity="error" 
          onClose={clearAllErrors}
          sx={{ mb: 2 }}
          data-testid="error-alert"
        >
          <Typography variant="body2">
            <strong>Fout:</strong> {currentError}
          </Typography>
        </Alert>
      )}

      {/* Session Setup Phase */}
      {!sessionState.sessionActive && (
        <SessionSetup
          participants={participants}
          voiceSetupState={voiceSetupState}
          sessionState={sessionState}
          onStartSession={handleStartSession}
          onVoiceSetupNext={voiceSetupState.setupPhase === 'voice_setup' ? recordVoiceProfile : nextSpeaker}
          onVoiceSetupSkip={skipVoiceSetup}
          onRetry={() => handleStartSession(false)}
        />
      )}

      {/* Active Session Interface */}
      {sessionState.sessionActive && (
        <>
          {/* Recording Controls */}
          <RecordingControls
            recordingState={recordingState}
            sessionState={sessionState}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
            disabled={voiceSetupState.setupPhase === 'voice_setup'}
          />

          {/* Recording Status */}
          <RecordingStatus
            recordingState={recordingState}
            sessionStats={sessionStats}
            audioProcessingState={audioProcessingState}
            config={config}
          />

          {/* Voice Setup Progress (if active) */}
          {voiceSetupState.setupPhase === 'voice_setup' && (
            <Box className="modern-card p-6" data-testid="voice-setup">
              <Typography variant="h6" gutterBottom>
                🎤 Stem Profiel Instellen
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Spreker {voiceSetupState.currentSetupSpeaker + 1} van {participants.length}: {participants[voiceSetupState.currentSetupSpeaker]?.name}
              </Typography>
              
              {voiceSetupState.isRecordingVoice ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">
                    Opname actief... Zeg enkele zinnen voor stemherkenning
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" gap={2}>
                  <button
                    onClick={recordVoiceProfile}
                    className="btn-primary px-4 py-2"
                    disabled={voiceSetupState.isRecordingVoice}
                    data-testid="record-voice-button"
                  >
                    Start Stem Opname
                  </button>
                  <button
                    onClick={nextSpeaker}
                    className="btn-neutral px-4 py-2"
                    data-testid="voice-setup-next-button"
                  >
                    Volgende
                  </button>
                  <button
                    onClick={skipVoiceSetup}
                    className="btn-neutral px-4 py-2"
                    data-testid="voice-setup-skip-button"
                  >
                    Overslaan
                  </button>
                </Box>
              )}
            </Box>
          )}

          {/* Transcription Output */}
          <TranscriptionOutput
            transcriptions={transcriptions}
            isLoading={audioProcessingState.isProcessingBackground}
            error={audioProcessingState.processingError}
            showConfidence={true}
            showSpeakerDetection={true}
          />

          {/* Session Controls */}
          <Box display="flex" justifyContent="center" mt={4}>
            <button
              onClick={handleStopSession}
              className="btn-danger px-6 py-3"
              disabled={sessionState.isStartingSession}
              data-testid="stop-session-button"
            >
              🛑 Session Beëindigen
            </button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default EnhancedLiveTranscriptionContainer;