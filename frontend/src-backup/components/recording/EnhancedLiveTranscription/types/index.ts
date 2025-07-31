/**
 * Enhanced Live Transcription TypeScript Definitions
 * ConversationHub - Complete Type System
 */

// ===== COMPONENT PROPS INTERFACES =====

export interface EnhancedLiveTranscriptionProps {
  meetingId?: any;
  conversationId?: number; // Support both prop names for backward compatibility
  participants?: Participant[];
  onTranscriptionUpdate?: (transcription: LiveTranscription) => void;
  onWhisperUpdate?: (transcription: LiveTranscription) => void;
  onSessionStatsUpdate?: (stats: SessionStats) => void;
  autoStart?: boolean;
  useVoiceSetup?: boolean;
}

// ===== CORE DATA TYPES =====

export interface Participant {
  id?: string;
  name: string;
  color?: string;
  role?: 'host' | 'participant' | 'observer';
  email?: string;
}

export interface ProcessedParticipant {
  id: string;
  name: string;
  color: string;
}

export interface LiveTranscription {
  id: string;
  text: string;
  speaker_name: string;
  speaker_id: string;
  speaker_color: string;
  confidence: number;
  spoken_at: string;
  source: TranscriptionSource;
  processing_status: ProcessingStatus;
}

export type TranscriptionSource = 'live' | 'whisper' | 'n8n' | 'background';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TranscriptionService = 'auto' | 'whisper' | 'n8n';

// ===== SESSION MANAGEMENT TYPES =====

export interface SessionState {
  sessionActive: boolean;
  sessionId: string | null;
  isStartingSession: boolean;
  startupProgress: string;
  error: string | null;
}

export interface SessionConfig {
  live_webspeech_enabled: boolean;
  whisper_enabled: boolean;
  whisper_chunk_duration: number;
  n8n_transcription_enabled: boolean;
  default_transcription_service: TranscriptionService;
  available_services: {
    whisper: boolean;
    n8n: boolean;
  };
  // Additional service response fields
  success?: boolean;
  sessionId?: any;
  useN8N?: boolean;
  preferredService?: string;
  features?: {
    mediaRecorder: boolean;
    speechRecognition: boolean;
    audioStream: boolean;
  };
  error?: string;
}

// ===== RECORDING MANAGEMENT TYPES =====

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  recordingStartTime: number | null;
  error: string | null;
  speechSupported: boolean;
}

export interface AudioProcessingState {
  isProcessingBackground: boolean;
  chunksProcessed: number;
  lastChunkTime: number | null;
  processingError: string | null;
}

// ===== VOICE SETUP TYPES =====

export interface VoiceSetupState {
  setupPhase: VoiceSetupPhase;
  currentSetupSpeaker: number;
  isRecordingVoice: boolean;
  voiceSetupError: string;
  voiceProfiles: VoiceProfile[];
}

export type VoiceSetupPhase = 'initial' | 'voice_setup' | 'ready';

export interface VoiceProfile {
  speakerId: string;
  speakerName: string;
  audioBlob: Blob;
  setupComplete: boolean;
}

// ===== SESSION STATISTICS TYPES =====

export interface SessionStats {
  totalDuration: number;
  chunksProcessed: number;
  transcriptionsReceived: number;
  whisperCalls: number;
  averageConfidence: number;
  activeService: TranscriptionService;
  errorCount: number;
}

// ===== API RESPONSE TYPES =====

export interface SessionStartResponse {
  success: boolean;
  session_id?: string;
  error?: string;
  features?: {
    mediaRecorder: boolean;
    speechRecognition: boolean;
    audioStream: boolean;
  };
}

export interface TranscriptionResponse {
  success: boolean;
  transcription?: LiveTranscription;
  transcriptions?: LiveTranscription[];
  error?: string;
  processing_details?: {
    processing_time: number;
    service_used: TranscriptionService;
    chunk_number: number;
  };
}

// ===== COMPONENT PROPS TYPES =====

export interface SessionSetupProps {
  participants: Participant[];
  voiceSetupState: VoiceSetupState;
  sessionState: SessionState;
  onStartSession: (useVoiceSetup: boolean) => Promise<void>;
  onVoiceSetupNext: () => Promise<void>;
  onVoiceSetupSkip: () => void;
  onRetry: () => void;
}

export interface RecordingControlsProps {
  recordingState: RecordingState;
  sessionState: SessionState;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onPauseRecording: () => Promise<void>;
  onResumeRecording: () => Promise<void>;
  disabled?: boolean;
}

export interface RecordingStatusProps {
  recordingState: RecordingState;
  sessionStats: SessionStats;
  audioProcessingState: AudioProcessingState;
  config: SessionConfig;
}

export interface TranscriptionOutputProps {
  transcriptions: LiveTranscription[];
  isLoading: boolean;
  error?: string;
  showConfidence?: boolean;
  showSpeakerDetection?: boolean;
}

// ===== HOOK RETURN TYPES =====

export interface UseSessionManagerReturn {
  sessionState: SessionState;
  startSession: (useVoiceSetup?: boolean) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  stopSession: () => Promise<void>;
  clearError: () => void;
}

export interface UseAudioRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  clearError: () => void;
  processAudioChunk: () => Promise<void>;
}

export interface UseTranscriptionProcessorReturn {
  audioProcessingState: AudioProcessingState;
  sessionStats: SessionStats;
  processAudioChunk: (audioBlob: Blob) => Promise<void>;
  resetStats: () => void;
  clearError: () => void;
  updateDuration: (seconds: number) => void;
  cleanup: () => void;
}

export interface UseVoiceSetupReturn {
  voiceSetupState: VoiceSetupState;
  startVoiceSetup: () => void;
  recordVoiceProfile: () => Promise<void>;
  nextSpeaker: () => Promise<void>;
  skipVoiceSetup: () => void;
  resetVoiceSetup: () => void;
  clearError: () => void;
  stopVoiceRecording: () => void;
}

// ===== EVENT TYPES =====

export interface TranscriptionUpdateEvent {
  transcription: LiveTranscription;
  sessionId: string;
  timestamp: number;
}

export interface SessionStatsUpdateEvent {
  stats: SessionStats;
  sessionId: string;
  timestamp: number;
}

// ===== ERROR TYPES =====

export interface TranscriptionError extends Error {
  code?: string;
  details?: Record<string, any>;
  retryable?: boolean;
}

// ===== UTILITY TYPES =====

export type RecordingStateKey = keyof RecordingState;
export type SessionStateKey = keyof SessionState;
export type AudioProcessingStateKey = keyof AudioProcessingState;