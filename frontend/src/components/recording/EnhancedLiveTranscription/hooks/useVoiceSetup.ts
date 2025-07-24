import { useState, useCallback, useRef } from 'react';
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

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
   * Record voice sample for speaker identification
   */
  const recordVoiceSample = useCallback(async (duration: number = 5000): Promise<Blob> => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      audioStreamRef.current = stream;
      recordedChunksRef.current = [];

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Return promise that resolves when recording is complete
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          
          // Cleanup
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
          }
          
          resolve(audioBlob);
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error('Recording failed: ' + event.error?.message));
        };

        // Start recording
        mediaRecorder.start();

        // Stop after specified duration
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, duration);
      });

    } catch (error) {
      console.error('❌ Failed to record voice sample:', error);
      throw error;
    }
  }, []);

  /**
   * Stop voice recording manually
   */
  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    setVoiceSetupState(prev => ({
      ...prev,
      isRecordingVoice: false
    }));
  }, []);

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
      const voiceBlob = await recordVoiceSample(5000);
      
      const speakerId = currentSpeaker.id || 
        `participant_${currentSpeaker.name.toLowerCase().replace(/\s+/g, '_')}_${voiceSetupState.currentSetupSpeaker}`;

      // Setup voice profile with service (only two parameters)
      const result = await enhancedLiveTranscriptionService.setupVoiceProfile(speakerId, voiceBlob);

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
      const errorMessage = error instanceof Error ? 
        error.message : 'Unknown error occurred';

      setVoiceSetupState(prev => ({
        ...prev,
        isRecordingVoice: false,
        voiceSetupError: errorMessage
      }));
    }
  }, [participants, voiceSetupState.currentSetupSpeaker, sessionId, recordVoiceSample]);

  /**
   * Move to next speaker in voice setup
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
      // All speakers done
      setVoiceSetupState(prev => ({
        ...prev,
        setupPhase: 'ready',
        currentSetupSpeaker: 0,
        voiceSetupError: ''
      }));
      console.log('✅ Voice setup completed for all participants');
    }
  }, [voiceSetupState.currentSetupSpeaker, participants]);

  /**
   * Skip voice setup entirely
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
   * Reset voice setup to initial state
   */
  const resetVoiceSetup = useCallback(() => {
    // Stop any ongoing recording
    stopVoiceRecording();
    
    setVoiceSetupState({
      setupPhase: 'initial',
      currentSetupSpeaker: 0,
      isRecordingVoice: false,
      voiceSetupError: '',
      voiceProfiles: []
    });
    console.log('🔄 Voice setup reset');
  }, [stopVoiceRecording]);

  /**
   * Clear voice setup error
   */
  const clearError = useCallback(() => {
    setVoiceSetupState(prev => ({
      ...prev,
      voiceSetupError: ''
    }));
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