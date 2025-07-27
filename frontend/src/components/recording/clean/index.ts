/**
 * Barrel export for AutoRecordingPanel module
 * 
 * This file serves as the main entry point for the clean recording components.
 * It exports all public interfaces and the main component for easy importing.
 */

// Main component export
export { default as AutoRecordingPanel } from './AutoRecordingPanel';

// Type exports
export type {
  AudioChunk,
  RecordingSession,
  RecordingStatus,
  MeetingParticipant,
  AutoRecordingPanelProps,
  RecordingConfig,
  RecordingError,
  N8NWebhookPayload,
  MediaRecorderState,
  ChunkProcessingState,
  RecordingEventType,
  RecordingEvent
} from './types';

// Default configuration export
export {
  DEFAULT_RECORDING_CONFIG,
  SUPPORTED_MIME_TYPES,
  RECORDING_ERROR_MESSAGES
} from './types';

// Type guard utilities export
export {
  isRecordingError,
  isValidRecordingStatus,
  isValidAudioChunk
} from './types';

/**
 * Main export for easy importing
 * 
 * Usage examples:
 * 
 * // Import main component
 * import { AutoRecordingPanel } from '@/components/recording/clean';
 * 
 * // Import with types
 * import { AutoRecordingPanel, type AutoRecordingPanelProps } from '@/components/recording/clean';
 * 
 * // Import configuration
 * import { DEFAULT_RECORDING_CONFIG } from '@/components/recording/clean';
 * 
 * // Import type guards
 * import { isRecordingError } from '@/components/recording/clean';
 */

// Default export for convenience
export { default } from './AutoRecordingPanel';