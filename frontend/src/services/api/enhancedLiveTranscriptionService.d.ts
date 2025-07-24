// Enhanced Live Transcription Service TypeScript Definitions
// Complete interface matching the actual JavaScript implementation

export interface SessionStartOptions {
  sessionId?: string;
  onTranscription?: (transcription: any) => void;
  onError?: (error: Error) => void;
  useN8N?: boolean;
}

export interface SessionStartResult {
  success: boolean;
  sessionId?: string;
  error?: string;
  features?: {
    mediaRecorder: boolean;
    speechRecognition: boolean;
    audioStream: boolean;
  };
  useN8N?: boolean;
  preferredService?: string;
}

export interface ProcessChunkOptions {
  audioData: string;
  sessionId: string;
  preferredService?: string;
  useN8N?: boolean;
}

export interface ProcessChunkResult {
  success: boolean;
  transcription?: any;
  transcriptions?: any[];
  error?: string;
  primary_source?: string;
  session_stats?: any;
  processing_details?: any[];
}

export interface ServiceConfig {
  success: boolean;
  sessionId: any;
  useN8N: boolean;
  preferredService: string;
  features?: {
    mediaRecorder: boolean;
    speechRecognition: boolean;
    audioStream: boolean;
  };
  error?: string;
}

export interface ServiceStatus {
  isRecording: boolean;
  isPaused: boolean;
  hasAudioStream: boolean;
}

declare class EnhancedLiveTranscriptionService {
  // Properties
  currentSession: any;
  isRecording: boolean;
  isPaused: boolean;
  mediaRecorder: MediaRecorder | null;
  audioStream: MediaStream | null;
  speechRecognition: any;
  recognition: any;
  chunkInterval: any;
  audioChunks: Blob[];
  chunkCounter: number;
  whisperUpdateCallback: any;
  onError: ((error: Error) => void) | null;
  onServiceStatusChanged: ((status: any) => void) | null;
  lastProcessedTime: number;

  // Core recording methods
  startRecording(options?: SessionStartOptions): Promise<SessionStartResult>;
  stopRecording(): Promise<{ success: boolean; chunksProcessed?: number; sessionId?: string }>;
  pauseRecording(): Promise<{ success: boolean }>;
  resumeRecording(): Promise<{ success: boolean }>;
  
  // Audio processing methods
  processChunk(options: ProcessChunkOptions): Promise<ProcessChunkResult>;
  getCurrentAudioChunk(): Promise<Blob | null>;
  getAudioChunk(): Promise<string | null>; // Legacy method compatibility
  
  // Configuration methods
  getConfig(): Promise<ServiceConfig>;
  
  // Enhanced session methods (used by hooks)
  startEnhancedSession(config: any): Promise<SessionStartResult>;
  startEnhancedRecording(options?: SessionStartOptions): Promise<SessionStartResult>;
  setupVoiceProfile(config: any): Promise<any>;
  
  // Utility methods
  blobToBase64(blob: Blob): Promise<string>;
  isActivelyRecording(): boolean;
  getStatus(): ServiceStatus;
}

// Create singleton instance
declare const enhancedLiveTranscriptionService: EnhancedLiveTranscriptionService;

export default enhancedLiveTranscriptionService;
export { EnhancedLiveTranscriptionService };