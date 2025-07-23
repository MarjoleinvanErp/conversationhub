import { useState, useEffect, useRef, useCallback } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  RecordingState, 
  UseAudioRecorderReturn,
  TranscriptionError 
} from '../types';

export interface UseAudioRecorderProps {
  sessionId: string | null;
  onAudioChunk?: (audioBlob: Blob) => void;
  chunkDuration?: number; // seconds
}

/**
 * Audio Recording Hook
 * Handles MediaRecorder API, audio streaming, and chunk processing
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
    speechSupported: false
  });

  // Refs for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check speech recognition support on mount
   */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setRecordingState(prev => ({
      ...prev,
      speechSupported: !!SpeechRecognition
    }));
  }, []);

  /**
   * Recording timer effect
   */
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  /**
   * Chunk processing timer effect
   */
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused && onAudioChunk) {
      chunkTimerRef.current = setInterval(async () => {
        try {
          console.log('🎵 Processing audio chunk...');
          
          // Get current audio chunk from service
          const audioBlob = await enhancedLiveTranscriptionService.getCurrentAudioChunk();
          
          if (audioBlob) {
            onAudioChunk(audioBlob);
          }
        } catch (error) {
          console.error('❌ Error processing audio chunk:', error);
          setRecordingState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Audio chunk processing failed'
          }));
        }
      }, chunkDuration * 1000);
    } else {
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
    }

    return () => {
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused, onAudioChunk, chunkDuration]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      if (!sessionId) {
        throw new Error('No active session. Please start a session first.');
      }

      setRecordingState(prev => ({
        ...prev,
        error: null
      }));

      console.log('🎤 Starting audio recording for session:', sessionId);

      // Start recording via service
      const result = await enhancedLiveTranscriptionService.startEnhancedRecording({
        sessionId,
        useN8N: true
      });

      if (result.success) {
        setRecordingState(prev => ({
          ...prev,
          isRecording: true,
          isPaused: false,
          recordingStartTime: Date.now(),
          recordingTime: 0
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
        error: errorMessage
      }));
    }
  }, [sessionId]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      console.log('🛑 Stopping audio recording');

      // Stop recording via service
      await enhancedLiveTranscriptionService.stopRecording();

      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        recordingStartTime: null
      }));

      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
        chunkTimerRef.current = null;
      }

      console.log('✅ Recording stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(async () => {
    try {
      console.log('⏸️ Pausing recording');

      await enhancedLiveTranscriptionService.pauseRecording();

      setRecordingState(prev => ({
        ...prev,
        isPaused: true
      }));

      console.log('✅ Recording paused');

    } catch (error) {
      console.error('❌ Failed to pause recording:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(async () => {
    try {
      console.log('▶️ Resuming recording');

      await enhancedLiveTranscriptionService.resumeRecording();

      setRecordingState(prev => ({
        ...prev,
        isPaused: false
      }));

      console.log('✅ Recording resumed');

    } catch (error) {
      console.error('❌ Failed to resume recording:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume recording';
      
      setRecordingState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setRecordingState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (chunkTimerRef.current) {
        clearInterval(chunkTimerRef.current);
      }
      
      // Stop recording if still active
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
    clearError
  };
};