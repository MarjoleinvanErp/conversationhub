import { useState, useCallback } from 'react';
import type { 
  AudioProcessingState, 
  SessionStats, 
  SessionConfig,
  LiveTranscription,
  UseTranscriptionProcessorReturn 
} from '../types';

interface UseTranscriptionProcessorProps {
  sessionId: string | null;
  config: SessionConfig;
  onTranscriptionReceived?: (transcription: LiveTranscription) => void;
}

/**
 * STUB: useTranscriptionProcessor Hook
 * Minimal implementation for TypeScript compatibility
 */
export const useTranscriptionProcessor = ({
  sessionId,
  config,
  onTranscriptionReceived
}: UseTranscriptionProcessorProps): UseTranscriptionProcessorReturn => {

  // Processing state
  const [audioProcessingState, setAudioProcessingState] = useState<AudioProcessingState>({
    isProcessingBackground: false,
    chunksProcessed: 0,
    lastChunkTime: null,
    processingError: null
  });

  // Session statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalDuration: 0,
    chunksProcessed: 0,
    transcriptionsReceived: 0,
    whisperCalls: 0,
    averageConfidence: 0,
    activeService: config.default_transcription_service,
    errorCount: 0
  });

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    console.log('🎵 Processing audio chunk (STUB):', audioBlob.size, 'bytes');
    
    setAudioProcessingState(prev => ({
      ...prev,
      isProcessingBackground: true,
      chunksProcessed: prev.chunksProcessed + 1,
      lastChunkTime: Date.now()
    }));

    // Simulate processing
    setTimeout(() => {
      setAudioProcessingState(prev => ({
        ...prev,
        isProcessingBackground: false
      }));
    }, 1000);
  }, [onTranscriptionReceived]);

  const resetStats = useCallback(() => {
    setSessionStats({
      totalDuration: 0,
      chunksProcessed: 0,
      transcriptionsReceived: 0,
      whisperCalls: 0,
      averageConfidence: 0,
      activeService: config.default_transcription_service,
      errorCount: 0
    });
  }, [config.default_transcription_service]);

  const clearError = useCallback(() => {
    setAudioProcessingState(prev => ({
      ...prev,
      processingError: null
    }));
  }, []);

  const updateDuration = useCallback((seconds: number) => {
    setSessionStats(prev => ({
      ...prev,
      totalDuration: seconds
    }));
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up transcription processor (STUB)');
    setAudioProcessingState({
      isProcessingBackground: false,
      chunksProcessed: 0,
      lastChunkTime: null,
      processingError: null
    });
  }, []);

  return {
    audioProcessingState,
    sessionStats,
    processAudioChunk,
    resetStats,
    clearError,
    updateDuration,
    cleanup
  };
};