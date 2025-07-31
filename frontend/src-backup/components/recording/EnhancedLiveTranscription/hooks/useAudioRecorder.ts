import { useState, useCallback } from 'react';
import type { RecordingState, UseAudioRecorderReturn } from '../types';

interface UseAudioRecorderProps {
  sessionId: string | null;
  onAudioChunk?: (audioBlob: Blob) => void;
  chunkDuration?: number;
}

/**
 * STUB: useAudioRecorder Hook
 * Minimal implementation for TypeScript compatibility
 */
export const useAudioRecorder = ({
  sessionId,
  onAudioChunk,
  chunkDuration = 90
}: UseAudioRecorderProps): UseAudioRecorderReturn => {
  
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    recordingStartTime: null,
    error: null,
    speechSupported: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  });

  const startRecording = useCallback(async () => {
    console.log('🎤 Starting recording (STUB)');
    setRecordingState(prev => ({
      ...prev,
      isRecording: true,
      recordingStartTime: Date.now()
    }));
  }, []);

  const stopRecording = useCallback(async () => {
    console.log('⏹️ Stopping recording (STUB)');
    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false
    }));
  }, []);

  const pauseRecording = useCallback(async () => {
    console.log('⏸️ Pausing recording (STUB)');
    setRecordingState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeRecording = useCallback(async () => {
    console.log('▶️ Resuming recording (STUB)');
    setRecordingState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const clearError = useCallback(() => {
    setRecordingState(prev => ({ ...prev, error: null }));
  }, []);

  const processAudioChunk = useCallback(async () => {
    console.log('🎵 Processing audio chunk (STUB)');
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearError,
    processAudioChunk
  };
};