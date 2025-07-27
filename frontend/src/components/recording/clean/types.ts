// Core recording types for AutoRecordingPanel

export interface AudioChunk {
  /** Unique identifier for the chunk */
  id: string;
  /** The audio blob data */
  blob: Blob;
  /** When this chunk was created */
  timestamp: Date;
  /** Duration of the chunk in seconds */
  duration: number;
  /** Size of the chunk in bytes */
  size?: number;
  /** Whether this chunk was successfully sent to N8N */
  sent?: boolean;
  /** Error message if sending failed */
  error?: string;
}

export interface RecordingSession {
  /** Unique session identifier */
  id: string;
  /** Meeting this session belongs to */
  meetingId: string;
  /** When recording started */
  startTime: Date;
  /** When recording ended (if stopped) */
  endTime?: Date;
  /** All audio chunks in this session */
  chunks: AudioChunk[];
  /** Current session status */
  status: RecordingStatus;
  /** Total duration in seconds */
  totalDuration?: number;
  /** Any session-level errors */
  errors?: string[];
}

export type RecordingStatus = 'idle' | 'initializing' | 'recording' | 'paused' | 'stopped' | 'error';

export interface MeetingParticipant {
  /** Unique participant ID */
  id: string;
  /** Display name */
  name: string;
  /** Role in the meeting */
  role: string;
  /** Online status */
  status: 'online' | 'offline' | 'away';
  /** Optional avatar color */
  color?: string;
  /** Whether participant has microphone access */
  hasMicrophone?: boolean;
}

export interface AutoRecordingPanelProps {
  /** ID of the meeting being recorded */
  meetingId: string;
  /** Whether the panel is expanded */
  isExpanded: boolean;
  /** Callback when expand state changes */
  onToggleExpand: () => void;
  /** List of meeting participants */
  participants: MeetingParticipant[];
  /** Optional custom configuration */
  config?: RecordingConfig;
  /** Optional event callbacks */
  onRecordingStart?: (session: RecordingSession) => void;
  onRecordingStop?: (session: RecordingSession) => void;
  onChunkSent?: (chunk: AudioChunk) => void;
  onError?: (error: RecordingError) => void;
}

export interface RecordingConfig {
  /** Duration of each audio chunk in seconds (default: 90) */
  chunkDuration: number;
  /** N8N webhook URL for transcription */
  webhookUrl: string;
  /** Audio recording constraints */
  audioConstraints: MediaTrackConstraints;
  /** MediaRecorder options */
  mediaRecorderOptions: MediaRecorderOptions;
  /** Maximum number of retry attempts for failed chunks */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
}

export interface RecordingError {
  /** Error type */
  type: 'microphone' | 'mediarecorder' | 'network' | 'permission' | 'browser' | 'unknown';
  /** Error message */
  message: string;
  /** Original error object if available */
  originalError?: Error;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Suggested user action */
  userAction?: string;
}

export interface N8NWebhookPayload {
  /** Audio file */
  audio: File;
  /** Meeting identifier */
  meetingId: string;
  /** Chunk sequence number */
  chunkNumber: number;
  /** ISO timestamp */
  timestamp: string;
  /** Chunk duration in seconds */
  duration: string;
  /** Session ID for grouping chunks */
  sessionId: string;
  /** Additional metadata */
  metadata?: {
    participants: string[];
    audioFormat: string;
    sampleRate: number;
    channels: number;
  };
}

export interface MediaRecorderState {
  /** Current MediaRecorder instance */
  recorder: MediaRecorder | null;
  /** Audio stream from getUserMedia */
  stream: MediaStream | null;
  /** Current recording state */
  state: 'inactive' | 'recording' | 'paused';
  /** Whether recorder is initialized */
  initialized: boolean;
  /** Supported MIME types */
  supportedMimeTypes: string[];
}

export interface ChunkProcessingState {
  /** Currently processing chunks */
  processing: Set<string>;
  /** Failed chunks awaiting retry */
  failed: Map<string, { chunk: AudioChunk; retryCount: number; lastAttempt: Date }>;
  /** Successfully sent chunks */
  sent: Set<string>;
  /** Total chunks processed */
  totalProcessed: number;
}

// Utility types
export type RecordingEventType = 
  | 'session_start'
  | 'session_stop' 
  | 'chunk_created'
  | 'chunk_sent'
  | 'chunk_failed'
  | 'error_occurred'
  | 'status_changed';

export interface RecordingEvent {
  type: RecordingEventType;
  timestamp: Date;
  sessionId?: string;
  chunkId?: string;
  data?: any;
  error?: RecordingError;
}

// Default configurations
export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  chunkDuration: 90,
  webhookUrl: process.env.NODE_ENV === 'production' 
    ? 'http://n8n:5678/webhook/transcription'
    : 'http://localhost:5678/webhook/transcription',
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
    channelCount: 1
  },
  mediaRecorderOptions: {
    mimeType: 'audio/webm;codecs=opus',
    audioBitsPerSecond: 64000
  },
  maxRetries: 3,
  retryDelay: 5000
};

export const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mp3',
  'audio/wav'
];

// Error messages
export const RECORDING_ERROR_MESSAGES = {
  MICROPHONE_ACCESS_DENIED: 'Microfoon toegang geweigerd. Controleer browser instellingen.',
  MICROPHONE_NOT_FOUND: 'Geen microfoon gevonden. Controleer hardware.',
  MEDIARECORDER_NOT_SUPPORTED: 'Audio opname niet ondersteund in deze browser.',
  NETWORK_ERROR: 'Netwerkfout bij verzenden audio. Controleer internetverbinding.',
  UNKNOWN_ERROR: 'Onbekende fout opgetreden. Probeer opnieuw.',
  CHUNK_SEND_FAILED: 'Audio chunk kon niet verzonden worden naar N8N.',
  SESSION_ALREADY_ACTIVE: 'Er is al een actieve opname sessie.',
  INVALID_MEETING_ID: 'Ongeldig meeting ID opgegeven.'
} as const;

// Type guards
export function isRecordingError(error: any): error is RecordingError {
  return error && 
    typeof error === 'object' &&
    'type' in error &&
    'message' in error &&
    'timestamp' in error &&
    'recoverable' in error;
}

export function isValidRecordingStatus(status: string): status is RecordingStatus {
  return ['idle', 'initializing', 'recording', 'paused', 'stopped', 'error'].includes(status);
}

export function isValidAudioChunk(chunk: any): chunk is AudioChunk {
  return chunk &&
    typeof chunk === 'object' &&
    'id' in chunk &&
    'blob' in chunk &&
    'timestamp' in chunk &&
    'duration' in chunk &&
    chunk.blob instanceof Blob;
}