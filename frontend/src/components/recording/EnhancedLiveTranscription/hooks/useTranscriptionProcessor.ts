import { useState, useCallback, useRef } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  AudioProcessingState, 
  SessionStats, 
  UseTranscriptionProcessorReturn,
  SessionConfig,
  LiveTranscription,
  TranscriptionService
} from '../types';

export interface UseTranscriptionProcessorProps {
  sessionId: string | null;
  config: SessionConfig;
  onTranscriptionReceived: (transcription: LiveTranscription) => void;
  onWhisperReceived: (transcription: LiveTranscription) => void;
}

/**
 * Transcription Processing Hook
 * Handles audio chunk processing, service coordination, and statistics
 */
export const useTranscriptionProcessor = ({
  sessionId,
  config,
  onTranscriptionReceived,
  onWhisperReceived
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
  const chunkCounterRef = useRef<number>(0);
  const confidenceScoresRef = useRef<number[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Convert blob to base64 for API transmission
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:audio/webm;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
      reader.readAsDataURL(blob);
    });
  }, []);

  /**
   * Determine best transcription service based on config and availability
   */
  const getBestService = useCallback((): TranscriptionService => {
    if (config.default_transcription_service === 'auto') {
      // Auto-select based on availability
      if (config.available_services.n8n) return 'n8n';
      if (config.available_services.whisper) return 'whisper';
      return 'whisper'; // fallback
    }
    return config.default_transcription_service;
  }, [config]);

  /**
   * Process single audio chunk
   */
  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    if (!sessionId) {
      console.warn('No active session - cannot process audio chunk');
      return;
    }

    try {
      setAudioProcessingState(prev => ({
        ...prev,
        isProcessingBackground: true,
        processingError: null
      }));

      const chunkNumber = ++chunkCounterRef.current;
      const timestamp = Date.now();
      
      console.log('🎵 Processing audio chunk:', { 
        chunkNumber, 
        size: audioBlob.size, 
        sessionId 
      });

      // Convert audio to base64
      const audioData = await blobToBase64(audioBlob);
      
      // Determine service to use
      const serviceToUse = getBestService();
      
      // Prepare request payload
      const requestPayload = {
        session_id: sessionId,
        chunk_number: chunkNumber,
        audio_data: audioData,
        timestamp: new Date(timestamp).toISOString(),
        source: 'conversationhub',
        format: 'webm',
        processing_options: {
          speaker_diarization: true,
          language: 'nl',
          return_segments: true,
          service: serviceToUse
        }
      };

      // Process with enhanced service
      const result = await enhancedLiveTranscriptionService.processChunk(requestPayload);

      if (result.success && result.transcription) {
        // Update statistics
        const confidence = result.transcription.confidence || 0;
        confidenceScoresRef.current.push(confidence);
        
        const averageConfidence = confidenceScoresRef.current.reduce((a, b) => a + b, 0) / confidenceScoresRef.current.length;

        setSessionStats(prev => ({
          ...prev,
          chunksProcessed: chunkNumber,
          transcriptionsReceived: prev.transcriptionsReceived + 1,
          whisperCalls: serviceToUse === 'whisper' ? prev.whisperCalls + 1 : prev.whisperCalls,
          averageConfidence: averageConfidence,
          activeService: serviceToUse
        }));

        setAudioProcessingState(prev => ({
          ...prev,
          chunksProcessed: chunkNumber,
          lastChunkTime: timestamp,
          isProcessingBackground: false
        }));

        // Send to appropriate callback
        if (result.transcription.source === 'whisper') {
          onWhisperReceived(result.transcription);
        } else {
          onTranscriptionReceived(result.transcription);
        }

        console.log('✅ Audio chunk processed successfully:', {
          chunkNumber,
          service: serviceToUse,
          confidence: confidence,
          textPreview: result.transcription.text.substring(0, 50)
        });

      } else {
        throw new Error(result.error || 'Transcription processing failed');
      }

    } catch (error) {
      console.error('❌ Failed to process audio chunk:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      
      setAudioProcessingState(prev => ({
        ...prev,
        isProcessingBackground: false,
        processingError: errorMessage
      }));

      setSessionStats(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));

      // Clear error after delay
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      processingTimeoutRef.current = setTimeout(() => {
        setAudioProcessingState(prev => ({
          ...prev,
          processingError: null
        }));
      }, 10000); // Clear error after 10 seconds
    }
  }, [sessionId, getBestService, blobToBase64, onTranscriptionReceived, onWhisperReceived]);

  /**
   * Reset all statistics
   */
  const resetStats = useCallback(() => {
    chunkCounterRef.current = 0;
    confidenceScoresRef.current = [];
    
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

    console.log('📊 Transcription statistics reset');
  }, [config.default_transcription_service]);

  /**
   * Clear processing error
   */
  const clearError = useCallback(() => {
    setAudioProcessingState(prev => ({
      ...prev,
      processingError: null
    }));
  }, []);

  /**
   * Update total duration (called from parent timer)
   */
  const updateDuration = useCallback((seconds: number) => {
    setSessionStats(prev => ({
      ...prev,
      totalDuration: seconds
    }));
  }, []);

  /**
   * Cleanup on unmount
   */
  const cleanup = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
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