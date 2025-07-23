import { useState, useCallback, useRef } from 'react';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { 
  VoiceSetupState, 
  UseVoiceSetupReturn, 
  Participant,
  VoiceProfile 
} from '../types';

export interface UseVoiceSetupProps {
  participants: Participant[];
  sessionId: string | null;
}

/**
 * Voice Setup Hook
 * Handles voice profile recording and speaker identification setup
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

  // Recording refs
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceRecordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      voiceSetupError: '',
      voiceProfiles: []
    }));

    console.log('🎤 Starting voice setup for', participants.length, 'participants');
  }, [participants]);

  /**
   * Record voice profile for current speaker
   */
  const recordVoiceProfile = useCallback(async () => {
    if (!sessionId) {
      setVoiceSetupState(prev => ({
        ...prev,
        voiceSetupError: 'No active session for voice recording'
      }));
      return;
    }

    if (voiceSetupState.currentSetupSpeaker >= participants.length) {
      setVoiceSetupState(prev => ({
        ...prev,
        voiceSetupError: 'All participants already completed voice setup'
      }));
      return;
    }

    try {
      setVoiceSetupState(prev => ({
        ...prev,
        isRecordingVoice: true,
        voiceSetupError: ''
      }));

      const currentParticipant = participants[voiceSetupState.currentSetupSpeaker];
      
      console.log('🎙️ Starting voice recording for:', currentParticipant.name);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      // Setup MediaRecorder for voice profile
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      voiceRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data);
        }
      };

      // Handle recording completion
      mediaRecorder.onstop = async () => {
        try {
          console.log('🎤 Voice recording completed, processing...');
          
          // Create voice profile blob
          const voiceBlob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
          
          if (voiceBlob.size === 0) {
            throw new Error('No audio data recorded');
          }

          // Send voice profile to service
          const result = await enhancedLiveTranscriptionService.setupVoiceProfile(
            currentParticipant.id || currentParticipant.name,
            voiceBlob
          );

          if (result.success) {
            const voiceProfile: VoiceProfile = {
              speakerId: currentParticipant.id || currentParticipant.name,
              speakerName: currentParticipant.name,
              audioBlob: voiceBlob,
              setupComplete: true
            };

            setVoiceSetupState(prev => ({
              ...prev,
              isRecordingVoice: false,
              voiceProfiles: [...prev.voiceProfiles, voiceProfile]
            }));

            console.log('✅ Voice profile setup completed for:', currentParticipant.name);

          } else {
            throw new Error(result.error || 'Failed to setup voice profile');
          }

        } catch (error) {
          console.error('❌ Voice profile setup failed:', error);
          setVoiceSetupState(prev => ({
            ...prev,
            isRecordingVoice: false,
            voiceSetupError: error instanceof Error ? error.message : 'Voice setup failed'
          }));
        } finally {
          // Cleanup
          if (voiceStreamRef.current) {
            voiceStreamRef.current.getTracks().forEach(track => track.stop());
            voiceStreamRef.current = null;
          }
          voiceRecorderRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Voice MediaRecorder error:', event);
        setVoiceSetupState(prev => ({
          ...prev,
          isRecordingVoice: false,
          voiceSetupError: 'Voice recording failed'
        }));
      };

      // Start recording
      mediaRecorder.start();

      // Auto-stop after 10 seconds
      voiceRecordingTimeoutRef.current = setTimeout(() => {
        if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
          voiceRecorderRef.current.stop();
        }
      }, 10000);

    } catch (error) {
      console.error('❌ Failed to start voice recording:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to access microphone';
      
      setVoiceSetupState(prev => ({
        ...prev,
        isRecordingVoice: false,
        voiceSetupError: errorMessage
      }));

      // Cleanup on error
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach(track => track.stop());
        voiceStreamRef.current = null;
      }
    }
  }, [sessionId, voiceSetupState.currentSetupSpeaker, participants]);

  /**
   * Move to next speaker or complete setup
   */
  const nextSpeaker = useCallback(async () => {
    const nextIndex = voiceSetupState.currentSetupSpeaker + 1;
    
    if (nextIndex >= participants.length) {
      // All participants completed
      setVoiceSetupState(prev => ({
        ...prev,
        setupPhase: 'ready',
        currentSetupSpeaker: 0
      }));
      
      console.log('✅ Voice setup completed for all participants');
    } else {
      // Move to next participant
      setVoiceSetupState(prev => ({
        ...prev,
        currentSetupSpeaker: nextIndex,
        voiceSetupError: ''
      }));
      
      console.log('➡️ Moving to next speaker:', participants[nextIndex].name);
    }
  }, [voiceSetupState.currentSetupSpeaker, participants]);

  /**
   * Skip voice setup entirely
   */
  const skipVoiceSetup = useCallback(() => {
    // Stop any active recording
    if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
      voiceRecorderRef.current.stop();
    }

    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(track => track.stop());
      voiceStreamRef.current = null;
    }

    if (voiceRecordingTimeoutRef.current) {
      clearTimeout(voiceRecordingTimeoutRef.current);
      voiceRecordingTimeoutRef.current = null;
    }

    setVoiceSetupState(prev => ({
      ...prev,
      setupPhase: 'ready',
      isRecordingVoice: false,
      currentSetupSpeaker: 0,
      voiceSetupError: ''
    }));

    console.log('⏭️ Voice setup skipped');
  }, []);

  /**
   * Reset voice setup to initial state
   */
  const resetVoiceSetup = useCallback(() => {
    // Stop any active recording
    if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
      voiceRecorderRef.current.stop();
    }

    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(track => track.stop());
      voiceStreamRef.current = null;
    }

    if (voiceRecordingTimeoutRef.current) {
      clearTimeout(voiceRecordingTimeoutRef.current);
      voiceRecordingTimeoutRef.current = null;
    }

    setVoiceSetupState({
      setupPhase: 'initial',
      currentSetupSpeaker: 0,
      isRecordingVoice: false,
      voiceSetupError: '',
      voiceProfiles: []
    });

    console.log('🔄 Voice setup reset to initial state');
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
   * Stop current voice recording manually
   */
  const stopVoiceRecording = useCallback(() => {
    if (voiceRecorderRef.current && voiceRecorderRef.current.state === 'recording') {
      voiceRecorderRef.current.stop();
    }

    if (voiceRecordingTimeoutRef.current) {
      clearTimeout(voiceRecordingTimeoutRef.current);
      voiceRecordingTimeoutRef.current = null;
    }
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