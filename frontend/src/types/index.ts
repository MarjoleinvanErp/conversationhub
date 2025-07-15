// ==========================================
// ConversationHub TypeScript Definitions
// ==========================================

// User & Organization Types
export interface User {
  id: string;
  name: string;
  email: string;
  organization_id: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  privacy_settings: PrivacySettings;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

// Privacy & Filtering Types
export interface PrivacySettings {
  enable_privacy_filter: boolean;
  filter_keywords: string[];
  filter_patterns: string[];
  retention_days: number;
  allow_exports: boolean;
}

export interface PrivacyFilter {
  type: 'keyword' | 'pattern' | 'pii';
  value: string;
  replacement: string;
  confidence: number;
}

// Audio & Transcription Types
export interface AudioChunk {
  id: string;
  blob: Blob;
  timestamp: number;
  duration: number;
  size: number;
  format: 'webm' | 'mp3' | 'wav';
}

export interface TranscriptionRequest {
  audio_chunk: Blob;
  session_id: string;
  timestamp: number;
  organization_id: string;
  privacy_filtered: boolean;
  language?: 'nl' | 'en' | 'auto';
}

export interface TranscriptionResponse {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  duration: number;
  speaker_id?: string;
  privacy_filtered: boolean;
  filtered_content?: PrivacyFilter[];
  status: 'processing' | 'completed' | 'failed';
}

// Conversation Session Types
export interface ConversationSession {
  id: string;
  title: string;
  organization_id: string;
  created_by: string;
  status: 'active' | 'paused' | 'ended';
  participants: Participant[];
  transcriptions: TranscriptionResponse[];
  agenda_items: AgendaItem[];
  start_time: string;
  end_time?: string;
  metadata: SessionMetadata;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  role: 'host' | 'participant' | 'observer';
  join_time: string;
  leave_time?: string;
  speaking_time: number;
}

export interface SessionMetadata {
  total_duration: number;
  total_speaking_time: number;
  word_count: number;
  privacy_filters_applied: number;
  export_format?: 'pdf' | 'docx' | 'json' | 'n8n';
}

// Agenda & Meeting Types
export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: 'pending' | 'active' | 'completed';
  start_time?: string;
  end_time?: string;
  assigned_to?: string[];
  action_items: ActionItem[];
}

export interface ActionItem {
  id: string;
  description: string;
  assigned_to: string;
  due_date?: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status_code: number;
}

// Real-time Events Types
export interface RealTimeEvent {
  type: 'transcription' | 'participant_joined' | 'participant_left' | 'session_ended';
  session_id: string;
  timestamp: number;
  data: any;
}

export interface TranscriptionEvent extends RealTimeEvent {
  type: 'transcription';
  data: TranscriptionResponse;
}

// Form & Validation Types
export interface CreateSessionForm {
  title: string;
  participants: string[];
  agenda_items: Omit<AgendaItem, 'id' | 'status' | 'start_time' | 'end_time' | 'action_items'>[];
  privacy_settings?: Partial<PrivacySettings>;
}

export interface LoginForm {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegistrationForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  organization_name: string;
}

// Component Props Types
export interface AudioRecorderProps {
  onAudioChunk: (chunk: AudioChunk) => void;
  onError: (error: Error) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
}

export interface TranscriptionDisplayProps {
  transcriptions: TranscriptionResponse[];
  isLoading: boolean;
  error?: string;
}

export interface SessionControlsProps {
  session: ConversationSession;
  onStartSession: () => void;
  onPauseSession: () => void;
  onEndSession: () => void;
  onExportSession: (format: 'pdf' | 'docx' | 'json' | 'n8n') => void;
}

// Export Types for N8N Integration
export interface N8NExportData {
  session_id: string;
  session_title: string;
  transcriptions: {
    timestamp: string;
    speaker: string;
    text: string;
    confidence: number;
  }[];
  action_items: {
    description: string;
    assigned_to: string;
    due_date?: string;
    status: string;
  }[];
  metadata: {
    duration: number;
    participants: string[];
    word_count: number;
    export_timestamp: string;
  };
}

// Utility Types
export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';
export type ExportFormat = 'pdf' | 'docx' | 'json' | 'n8n';
export type Language = 'nl' | 'en' | 'auto';
export type UserRole = 'admin' | 'user' | 'viewer';
export type SessionStatus = 'active' | 'paused' | 'ended';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';