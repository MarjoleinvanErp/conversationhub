import { useState, useCallback } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  SessionState, 
  SessionConfig, 
  Participant, 
  ProcessedParticipant,
  UseSessionManagerReturn 
} from '../types';

interface UseSessionManagerProps {
  meetingId: any;
  participants: Participant[];
  config: SessionConfig;
}

/**
 * Process participants and ensure they have required fields
 */
const processParticipants = (participants: Participant[]): ProcessedParticipant[] => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
  
  return participants.map((p, index) => {
    const participantId = p.id || `participant_${p.name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
    
    return {
      id: participantId,
      name: p.name,
      color: p.color || colors[index % colors.length]
    };
  });
};

/**
 * Custom hook for session management
 * Handles session lifecycle, participants, and configuration
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
   * Start enhanced session
   */
  const startSession = useCallback(async (useVoiceSetup: boolean = false) => {
    try {
      setSessionState(prev => ({
        ...prev,
        isStartingSession: true,
        startupProgress: 'Initializing session...',
        error: null
      }));

      const participantList = participants || [];

      console.log('🚀 Starting enhanced session:', { 
        meetingId, 
        participants: participantList.length, 
        config 
      });

      // Check if participants are provided
      if (participantList.length === 0) {
        setSessionState(prev => ({
          ...prev,
          isStartingSession: false,
          error: 'No participants provided for session'
        }));
        
        return {
          success: false,
          error: 'No participants provided for session'
        };
      }

      const processedParticipants = processParticipants(participantList);

      // Start enhanced session with single config object
      const result = await enhancedLiveTranscriptionService.startEnhancedSession({
        meetingId,
        participants: processedParticipants,
        config,
        useVoiceSetup
      });

      if (result.success && result.sessionId) {
        setSessionState(prev => ({
          ...prev,
          sessionActive: true,
          sessionId: result.sessionId,
          isStartingSession: false,
          startupProgress: 'Session started!',
          error: null
        }));

        console.log('✅ Enhanced session started successfully:', result.sessionId);
        
        // Clear progress message after delay
        setTimeout(() => {
          setSessionState(prev => ({ ...prev, startupProgress: '' }));
        }, 2000);
        
        return {
          success: true,
          sessionId: result.sessionId
        };
      } else {
        throw new Error(result.error || 'Failed to start session');
      }

    } catch (error) {
      console.error('❌ Session start failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      
      setSessionState(prev => ({
        ...prev,
        isStartingSession: false,
        startupProgress: '',
        error: errorMessage
      }));

      return {
        success: false,
        error: errorMessage
      };
    }
  }, [meetingId, participants, config]);

  /**
   * Stop session
   */
  const stopSession = useCallback(async () => {
    try {
      console.log('🛑 Stopping session...');
      
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
      console.error('❌ Failed to stop session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop session';
      
      setSessionState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [sessionState.sessionId]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  return {
    sessionState,
    startSession,
    stopSession,
    clearError
  };
};