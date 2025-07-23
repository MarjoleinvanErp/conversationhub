import { useState, useCallback } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  SessionState, 
  SessionConfig, 
  Participant, 
  ProcessedParticipant,
  UseSessionManagerReturn,
  TranscriptionError
} from '../types';

export interface UseSessionManagerProps {
  meetingId?: any;
  participants?: Participant[]; 
  config: SessionConfig;
}

/**
 * Session Management Hook
 * Handles session lifecycle, initialization, and cleanup
 */
export const useSessionManager = ({ 
  meetingId, 
  participants, 
  config 
}: UseSessionManagerProps): UseSessionManagerReturn => {
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>({
    sessionActive: false,
    sessionId: null,
    isStartingSession: false,
    startupProgress: '',
    error: null
  });

  /**
   * Process participants for session
   */
  const processParticipants = useCallback((participants: Participant[]): ProcessedParticipant[] => {
    return participants.map((p, index) => {
      const participantId = p.id 
        ? `participant_${p.id}` 
        : `participant_${p.name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
      
      return {
        id: participantId,
        name: p.name,
        color: p.color || '#6B7280'
      };
    });
  }, []);

  /**
   * Start enhanced session
   */
  const startSession = useCallback(async (useVoiceSetup: boolean = false) => {
    try {
      setSessionState(prev => ({
        ...prev,
        isStartingSession: true,
        error: null,
        startupProgress: 'Initialiseren...'
      }));
      
      console.log('🚀 Starting enhanced session:', { meetingId, participants: participants.length, config });
      
      // Validate inputs
      if (!meetingId) {
        throw new Error('Meeting ID is required');
      }
      
      if (participants.length === 0) {
        throw new Error('At least one participant is required');
      }
      
      // Process participants
      setSessionState(prev => ({ ...prev, startupProgress: 'Deelnemers verwerken...' }));
      const processedParticipants = processParticipants(participants);
      
      // Start session with service
      setSessionState(prev => ({ ...prev, startupProgress: 'Verbinden met server...' }));
      const result = await enhancedLiveTranscriptionService.startEnhancedSession(
        meetingId,
        processedParticipants
      );

      if (result.success && result.session_id) {
        setSessionState(prev => ({
          ...prev,
          sessionActive: true,
          sessionId: result.session_id,
          isStartingSession: false,
          startupProgress: 'Session gestart!'
        }));
        
        console.log('✅ Enhanced session started successfully:', result.session_id);
        
        // Clear progress after delay
        setTimeout(() => {
          setSessionState(prev => ({ ...prev, startupProgress: '' }));
        }, 2000);
        
        return { 
          success: true, 
          sessionId: result.session_id 
        };
      } else {
        throw new Error(result.error || 'Failed to start session');
      }

    } catch (error) {
      console.error('❌ Failed to start session:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      
      setSessionState(prev => ({
        ...prev,
        isStartingSession: false,
        error: errorMessage,
        startupProgress: ''
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [meetingId, participants, config, processParticipants]);

  /**
   * Stop session
   */
  const stopSession = useCallback(async () => {
    try {
      console.log('🛑 Stopping session:', sessionState.sessionId);
      
      if (sessionState.sessionId) {
        await enhancedLiveTranscriptionService.stopRecording();
      }
      
      setSessionState({
        sessionActive: false,
        sessionId: null,
        isStartingSession: false,
        startupProgress: '',
        error: null
      });
      
      console.log('✅ Session stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping session:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop session';
      
      setSessionState(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      // Still reset session state even if stop failed
      setTimeout(() => {
        setSessionState({
          sessionActive: false,
          sessionId: null,
          isStartingSession: false,
          startupProgress: '',
          error: null
        });
      }, 1000);
    }
  }, [sessionState.sessionId]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setSessionState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    sessionState,
    startSession,
    stopSession,
    clearError
  };
};