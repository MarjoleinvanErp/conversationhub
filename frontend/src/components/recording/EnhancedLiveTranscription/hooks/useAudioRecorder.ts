import { useState, useEffect, useRef, useCallback } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { RecordingState, UseAudioRecorderReturn } from '../types';

interface UseAudioRecorderProps {
  sessionId: string | null;
  onAudioChunk?: (audioBlob: Blob) => void;
  onTranscription?: (transcription: any) => void;
  onError?: (error: Error) => void;
  chunkDuration?: number;
}

/**
 * Custom hook for audio recording management
 * Handles MediaRecorder, audio chunks, and recording state
 */
export const useAudioRecorder = ({
  sessionId,
  onAudioChunk,
  onTranscription,
  onError,
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

  // Refs for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * Update recording timer
   */
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingTime: Date.now() - (prev.recordingStartTime || Date.now())
        }));
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      if (!sessionId) {
        throw new Error('No session ID provided for recording');
      }

      setRecordingState(prev => ({ ...prev, error: null }));

      console.log('🎤 Starting recording for session:', sessionId);

      const result = await enhancedLiveTranscriptionService.startRecording({
        sessionId,
        onTranscription: (transcription) => {
          console.log('📝 Transcription received:', transcription);
          if (onTranscription) {
            onTranscription(transcription);
          }
        },
        onError: (error) => {
          console.error('❌ Recording error:', error);
          setRecordingState(prev => ({
            ...prev,
            error: error.message,
            isRecording: false,
            isPaused: false
          }));
          if (onError) {
            onError(error);
          }
        }
      });

      if (result.success) {
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          isPaused: false,
          recordingStartTime: Date.now(),
          recordingTime: 0,
          error: null
        }));

        console.log('✅ Recording started successfully');
      } else {
        throw new Error(result.error || 'Failed to start recording');
      }

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
        isPaused: false
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [sessionId, onTranscription, onError]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      console.log('🛑 Stopping recording...');
      
      await enhancedLiveTranscriptionService.stopRecording();
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        recordingTime: 0,
        recordingStartTime: null
      }));

      console.log('✅ Recording stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [onError]);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(async () => {
    try {
      console.log('⏸️ Pausing recording...');
      
      await enhancedLiveTranscriptionService.pauseRecording();
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: true
      }));

      console.log('✅ Recording paused successfully');

    } catch (error) {
      console.error('❌ Failed to pause recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [onError]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(async () => {
    try {
      console.log('▶️ Resuming recording...');
      
      await enhancedLiveTranscriptionService.resumeRecording();
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: false
      }));

      console.log('✅ Recording resumed successfully');

    } catch (error) {
      console.error('❌ Failed to resume recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage
      }));

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  }, [onError]);

  /**
   * Process audio chunk manually
   */
  const processAudioChunk = useCallback(async () => {
    try {
      const audioBlob = await enhancedLiveTranscriptionService.getCurrentAudioChunk();
      if (audioBlob && onAudioChunk) {
        onAudioChunk(audioBlob);
      }
    } catch (error) {
      console.error('Failed to process audio chunk:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [onAudioChunk, onError]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setRecordingState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (recordingState.isRecording) {
        enhancedLiveTranscriptionService.stopRecording().catch(console.error);
      }
    };
  }, [recordingState.isRecording]);

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