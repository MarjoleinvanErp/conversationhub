import { useState, useCallback } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  VoiceSetupState, 
  VoiceProfile, 
  Participant,
  VoiceSetupPhase,
  UseVoiceSetupReturn 
} from '../types';

interface UseVoiceSetupProps {
  participants: Participant[];
  sessionId: string | null;
}

/**
 * Custom hook for voice profile setup
 * Handles voice recording and speaker identification setup
 */
export const useVoiceSetup = ({
  participants,
  sessionId
}: UseVoiceSetupProps): UseVoiceSetupReturn => {

  // Voice setup state
  const [voiceSetupState, setVoiceSetupState] = useState<VoiceSetupState>({
    setupPhase: 'initial',
    currentSetupSpeaker: 0,
    isRecordingVoice: false,
    voiceSetupError: '',
    voiceProfiles: []
  });

  /**
   * Start voice setup process
   */
  const startVoiceSetup = useCallback(() => {
    if (participants.length === 0) {
      setVoiceSetupState(prev => ({
        ...prev,
        voiceSetupError: 'No participants available for voice setup'
      }));
      return;
    }

    setVoiceSetupState(prev => ({
      ...prev,
      setupPhase: 'voice_setup',
      currentSetupSpeaker: 0,
      voiceSetupError: ''
    }));

    console.log('🎙️ Starting voice setup for', participants.length, 'participants');
  }, [participants]);

  /**
   * Record voice profile for current speaker
   */
  const recordVoiceProfile = useCallback(async () => {
    const currentSpeaker = participants[voiceSetupState.currentSetupSpeaker];
    if (!currentSpeaker || !sessionId) {
      setVoiceSetupState(prev => ({
        ...prev,
        voiceSetupError: 'No speaker selected or session not available'
      }));
      return;
    }

    try {
      setVoiceSetupState(prev => ({
        ...prev,
        isRecordingVoice: true,
        voiceSetupError: ''
      }));

      console.log('🎤 Recording voice profile for:', currentSpeaker.name);

      // Record voice sample (5 seconds)
      const voiceBlob = await enhancedLiveTranscriptionService.recordVoiceSample(5000);
      
      const speakerId = currentSpeaker.id || 
        `participant_${currentSpeaker.name.toLowerCase().replace(/\s+/g, '_')}_${voiceSetupState.currentSetupSpeaker}`;

      // Setup voice profile with single config object
      const result = await enhancedLiveTranscriptionService.setupVoiceProfile({
        speakerId,
        speakerName: currentSpeaker.name,
        voiceBlob,
        sessionId
      });

      setVoiceSetupState(prev => ({
        ...prev,
        isRecordingVoice: false
      }));

      if (result.success) {
        // Add voice profile to state
        const newProfile: VoiceProfile = {
          speakerId,
          speakerName: currentSpeaker.name,
          audioBlob: voiceBlob,
          setupComplete: true
        };

        setVoiceSetupState(prev => ({
          ...prev,
          voiceProfiles: [...prev.voiceProfiles, newProfile],
          voiceSetupError: ''
        }));

        console.log('✅ Voice profile recorded successfully for:', currentSpeaker.name);
      } else {
        throw new Error(result.error || 'Voice profile setup failed');
      }

    } catch (error) {
      console.error('❌ Failed to record voice profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Voice recording failed';
      
      setVoiceSetupState(prev => ({
        ...prev,
        isRecordingVoice: false,
        voiceSetupError: errorMessage
      }));
    }
  }, [participants, voiceSetupState.currentSetupSpeaker, sessionId]);

  /**
   * Move to next speaker
   */
  const nextSpeaker = useCallback(async () => {
    const nextIndex = voiceSetupState.currentSetupSpeaker + 1;
    
    if (nextIndex < participants.length) {
      setVoiceSetupState(prev => ({
        ...prev,
        currentSetupSpeaker: nextIndex,
        voiceSetupError: ''
      }));
      
      console.log('➡️ Moving to next speaker:', participants[nextIndex]?.name);
    } else {
      // All speakers completed
      setVoiceSetupState(prev => ({
        ...prev,
        setupPhase: 'ready',
        currentSetupSpeaker: 0
      }));
      
      console.log('✅ Voice setup completed for all participants');
    }
  }, [voiceSetupState.currentSetupSpeaker, participants]);

  /**
   * Skip voice setup
   */
  const skipVoiceSetup = useCallback(() => {
    setVoiceSetupState(prev => ({
      ...prev,
      setupPhase: 'ready',
      currentSetupSpeaker: 0,
      voiceSetupError: ''
    }));
    
    console.log('⏭️ Voice setup skipped');
  }, []);

  /**
   * Reset voice setup
   */
  const resetVoiceSetup = useCallback(() => {
    setVoiceSetupState({
      setupPhase: 'initial',
      currentSetupSpeaker: 0,
      isRecordingVoice: false,
      voiceSetupError: '',
      voiceProfiles: []
    });
    
    console.log('🔄 Voice setup reset');
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setVoiceSetupState(prev => ({
      ...prev,
      voiceSetupError: ''
    }));
  }, []);

  /**
   * Stop voice recording
   */
  const stopVoiceRecording = useCallback(() => {
    setVoiceSetupState(prev => ({
      ...prev,
      isRecordingVoice: false
    }));
    
    console.log('⏹️ Voice recording stopped');
  }, []);

  return {
    voiceSetupState,
    startVoiceSetup,
    recordVoiceProfile,
    nextSpeaker,
    skipVoiceSetup,
    resetVoiceSetup,
    clearError,
    stopVoiceRecording
  };
};