// frontend/src/types/n8n.ts

/**
 * N8N Transcription Service Types
 * TypeScript definitions for N8N workflow integration
 */

export interface N8NConfig {
  auto_export_enabled: boolean;
  auto_export_interval_minutes: number;
  webhook_url: string | null;
  api_key: string | null;
  transcription_enabled: boolean;
  transcription_webhook_url: string | null;
  timeout_seconds: number;
}

export interface N8NTranscriptionRequest {
  session_id: string;
  chunk_number: number;
  audio_data: string; // base64 encoded
  timestamp: string; // ISO string
  source: 'conversationhub';
  format: 'webm';
  processing_options: {
    speaker_diarization: boolean;
    language: string;
    return_segments: boolean;
  };
}

export interface N8NSpeakerSegment {
  text: string;
  speaker: string; // e.g., "SPEAKER_00"
  speaker_confidence: number;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
}

export interface N8NSpeakerAnalysis {
  segments: N8NSpeakerSegment[];
}

export interface N8NTranscriptionResponse {
  transcription: string;
  confidence: number;
  processing_time_ms: number;
  speaker_analysis: N8NSpeakerAnalysis;
}

export interface N8NProcessedResult {
  success: boolean;
  transcriptions: ProcessedTranscription[];
  transcription: ProcessedTranscription; // backward compatibility
  speaker_analysis: N8NSpeakerAnalysis;
  n8n_metadata: {
    processing_time: number | null;
    chunk_number: number;
    segments_count: number;
  };
}

export interface ProcessedTranscription {
  id: number;
  text: string;
  speaker_name: string;
  speaker_id: string;
  speaker_color: string;
  confidence: number;
  speaker_confidence: number;
  spoken_at: string;
  source: TranscriptionSource;
  processing_status: ProcessingStatus;
}

export type TranscriptionSource = 'live' | 'whisper' | 'n8n';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TranscriptionConfig {
  live_webspeech_enabled: boolean;
  whisper_enabled: boolean;
  whisper_chunk_duration: number;
  n8n_transcription_enabled: boolean;
  default_transcription_service: TranscriptionService;
  available_services: {
    whisper: boolean;
    n8n: boolean;
  };
  n8n_enabled: boolean;
  n8n_webhook_configured: boolean;
}

export type TranscriptionService = 'auto' | 'whisper' | 'n8n';

export interface ServiceTestResult {
  available: boolean;
  status: string;
  success?: boolean;
  error?: string;
  response_time?: number;
  message?: string;
}

export interface ServiceTestResults {
  whisper: ServiceTestResult;
  n8n: ServiceTestResult;
}

export interface LiveTranscriptionOptions {
  sessionId: string;
  preferredService?: TranscriptionService;
  useN8N?: boolean;
}

export interface ProcessChunkOptions {
  audioData: string;
  sessionId: string;
  preferredService?: TranscriptionService;
  useN8N?: boolean;
}

export interface ProcessChunkResult {
  success: boolean;
  transcription?: ProcessedTranscription;
  transcriptions?: ProcessedTranscription[];
  primary_source?: TranscriptionSource;
  session_stats?: SessionStats;
  processing_details?: Record<string, any>;
  error?: string;
}

export interface SessionStats {
  total_chunks: number;
  voice_setup_complete: boolean;
  n8n_enabled: boolean;
  whisper_enabled: boolean;
  last_successful_service?: TranscriptionSource;
}

export interface LiveTranscriptionData {
  id: string;
  text: string;
  speaker_name: string;
  speaker_color: string;
  confidence?: number;
  timestamp: Date;
  source: TranscriptionSource;
  chunkNumber?: number;
  segmentIndex?: number;
  isLive?: boolean;
}

export interface RecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  hasAudioStream: boolean;
  hasMediaRecorder: boolean;
  hasSpeechRecognition: boolean;
  audioChunksCount: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface N8NConnectionTest {
  success: boolean;
  message?: string;
  error?: string;
  response_time?: number;
}