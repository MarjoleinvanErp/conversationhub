declare class EnhancedLiveTranscriptionService {
  // Properties
  currentSession: any;
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  audioStream: MediaStream | null;
  speechRecognition: any;
  chunkInterval: any;
  audioChunks: Blob[];
  chunkCounter: number;
  whisperUpdateCallback: any;

  // Methods that exist in the actual service
  startRecording(options?: {
    sessionId?: string;
    onTranscription?: (transcription: any) => void;
    onError?: (error: Error) => void;
    useN8N?: boolean;
  }): Promise<{
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
  }>;

  stopRecording(): Promise<{ success: boolean }>;
  pauseRecording(): Promise<{ success: boolean }>;
  resumeRecording(): Promise<{ success: boolean }>;
  
  processChunk(options: {
    audioData: string;
    sessionId: string;
    preferredService?: string;
    useN8N?: boolean;
  }): Promise<{
    success: boolean;
    transcription?: any;
    transcriptions?: any[];
    error?: string;
    primary_source?: string;
    session_stats?: any;
    processing_details?: any[];
  }>;

  getConfig(): Promise<{
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
  }>;
  
  getCurrentAudioChunk(): Promise<Blob | null>;
  getAudioChunk(): Promise<string | null>; // Legacy method
  
  blobToBase64(blob: Blob): Promise<string>;
  isActivelyRecording(): boolean;
  getStatus(): {
    isRecording: boolean;
    isPaused: boolean;
    hasAudioStream: boolean;
  };
}

export default EnhancedLiveTranscriptionService;