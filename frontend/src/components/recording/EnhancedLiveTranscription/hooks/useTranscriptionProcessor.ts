import { useState, useCallback, useRef } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  AudioProcessingState, 
  SessionStats, 
  SessionConfig,
  LiveTranscription,
  TranscriptionService,
  UseTranscriptionProcessorReturn 
} from '../types';

interface UseTranscriptionProcessorProps {
  sessionId: string | null;
  config: SessionConfig;
  onTranscriptionReceived?: (transcription: LiveTranscription) => void;
  onWhisperReceived?: (transcription: LiveTranscription) => void;
  onStatsUpdate?: (stats: SessionStats) => void;
}

/**
 * Custom hook for transcription processing
 * Handles audio chunk processing, statistics, and transcription results
 */
export const useTranscriptionProcessor = ({
  sessionId,
  config,
  onTranscriptionReceived,
  onWhisperReceived,
  onStatsUpdate
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

  // Processing refs
  const chunkCounterRef = useRef(0);
  const confidenceScoresRef = useRef<number[]>([]);

  /**
   * Process audio chunk for transcription
   */
  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!sessionId) {
      console.warn('No session ID available for chunk processing');
      return;
    }

    try {
      setAudioProcessingState(prev => ({
        ...prev,
        isProcessingBackground: true,
        processingError: null
      }));

      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data URL prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      chunkCounterRef.current += 1;

      // Prepare request payload matching interface
      const requestPayload = {
        audioData: base64Audio,
        sessionId: sessionId,
        preferredService: config.default_transcription_service,
        useN8N: config.n8n_transcription_enabled
      };

      console.log('🔄 Processing audio chunk:', {
        chunkNumber: chunkCounterRef.current,
        audioSize: audioBlob.size,
        sessionId,
        service: requestPayload.preferredService
      });

      const result = await enhancedLiveTranscriptionService.processChunk(requestPayload);

      if (result.success) {
        // Update processing state
        setAudioProcessingState(prev => ({
          ...prev,
          isProcessingBackground: false,
          chunksProcessed: prev.chunksProcessed + 1,
          lastChunkTime: Date.now()
        }));

        // Update statistics
        setSessionStats(prev => {
          const newStats = {
            ...prev,
            chunksProcessed: prev.chunksProcessed + 1,
            whisperCalls: prev.whisperCalls + 1
          };

          // Handle transcription results
          if (result.transcription) {
            newStats.transcriptionsReceived += 1;
            
            // Track confidence scores
            if (result.transcription.confidence) {
              confidenceScoresRef.current.push(result.transcription.confidence);
              newStats.averageConfidence = 
                confidenceScoresRef.current.reduce((sum, conf) => sum + conf, 0) / 
                confidenceScoresRef.current.length;
            }

            // Call transcription callback
            if (onTranscriptionReceived) {
              onTranscriptionReceived(result.transcription);
            }
          }

          // Handle multiple transcriptions
          if (result.transcriptions && result.transcriptions.length > 0) {
            newStats.transcriptionsReceived += result.transcriptions.length;
            
            result.transcriptions.forEach(transcription => {
              if (transcription.confidence) {
                confidenceScoresRef.current.push(transcription.confidence);
              }
              
              if (onTranscriptionReceived) {
                onTranscriptionReceived(transcription);
              }
            });

            // Recalculate average confidence
            if (confidenceScoresRef.current.length > 0) {
              newStats.averageConfidence = 
                confidenceScoresRef.current.reduce((sum, conf) => sum + conf, 0) / 
                confidenceScoresRef.current.length;
            }
          }

          // Update stats callback
          if (onStatsUpdate) {
            onStatsUpdate(newStats);
          }

          return newStats;
        });

        console.log('✅ Audio chunk processed successfully');

      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (error) {
      console.error('❌ Failed to process audio chunk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      setAudioProcessingState(prev => ({
        ...prev,
        isProcessingBackground: false,
        processingError: errorMessage
      }));

      setSessionStats(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
    }
  }, [sessionId, config, onTranscriptionReceived, onStatsUpdate]);

  /**
   * Reset statistics
   */
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

    setAudioProcessingState({
      isProcessingBackground: false,
      chunksProcessed: 0,
      lastChunkTime: null,
      processingError: null
    });

    chunkCounterRef.current = 0;
    confidenceScoresRef.current = [];
  }, [config.default_transcription_service]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setAudioProcessingState(prev => ({
      ...prev,
      processingError: null
    }));
  }, []);

  /**
   * Update duration from recording timer
   */
  const updateDuration = useCallback((seconds: number) => {
    setSessionStats(prev => ({
      ...prev,
      totalDuration: Math.floor(seconds / 1000)
    }));
  }, []);

  /**
   * Cleanup processing resources
   */
  const cleanup = useCallback(() => {
    setAudioProcessingState({
      isProcessingBackground: false,
      chunksProcessed: 0,
      lastChunkTime: null,
      processingError: null
    });

    chunkCounterRef.current = 0;
    confidenceScoresRef.current = [];
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