// frontend/src/test-utils/testHelpers.ts

import { render, RenderOptions, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import type { 
  TranscriptionConfig, 
  ServiceTestResults, 
  ProcessChunkResult 
} from '../types/n8n';

// Custom render function with providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockTranscriptionConfig = (
  overrides?: Partial<TranscriptionConfig>
): TranscriptionConfig => ({
  live_webspeech_enabled: true,
  whisper_enabled: true,
  whisper_chunk_duration: 90,
  n8n_transcription_enabled: true,
  default_transcription_service: 'auto',
  available_services: {
    whisper: true,
    n8n: true
  },
  n8n_enabled: true,
  n8n_webhook_configured: true,
  ...overrides
});

export const createMockServiceTestResults = (
  overrides?: Partial<ServiceTestResults>
): ServiceTestResults => ({
  whisper: {
    available: true,
    status: 'Whisper service configured'
  },
  n8n: {
    available: true,
    status: 'Connected',
    success: true,
    response_time: 150
  },
  ...overrides
});

export const createMockProcessChunkResult = (
  overrides?: Partial<ProcessChunkResult>
): ProcessChunkResult => ({
  success: true,
  transcription: {
    id: 1,
    text: 'Test transcription',
    speaker_name: 'Spreker A',
    speaker_id: 'SPEAKER_00',
    speaker_color: '#3B82F6',
    confidence: 0.95,
    speaker_confidence: 0.92,
    spoken_at: new Date().toISOString(),
    source: 'n8n',
    processing_status: 'completed'
  },
  transcriptions: [
    {
      id: 1,
      text: 'Test transcription',
      speaker_name: 'Spreker A',
      speaker_id: 'SPEAKER_00',
      speaker_color: '#3B82F6',
      confidence: 0.95,
      speaker_confidence: 0.92,
      spoken_at: new Date().toISOString(),
      source: 'n8n',
      processing_status: 'completed'
    }
  ],
  primary_source: 'n8n',
  session_stats: {
    total_chunks: 1,
    voice_setup_complete: true,
    n8n_enabled: true,
    whisper_enabled: true,
    last_successful_service: 'n8n'
  },
  ...overrides
});

// Mock API responses
export const mockApiSuccess = <T>(data: T) => ({
  data: {
    success: true,
    data
  }
});

export const mockApiError = (error: string) => ({
  data: {
    success: false,
    error
  }
});

// Audio testing utilities
export const createMockAudioBlob = (content = 'mock-audio-data') => 
  new Blob([content], { type: 'audio/webm' });

export const createMockMediaStream = () => ({
  getTracks: () => [{ stop: jest.fn() }],
  getAudioTracks: () => [{ stop: jest.fn() }]
});

// Time testing utilities
export const advanceTimersAndFlush = async (ms: number) => {
  jest.advanceTimersByTime(ms);
  await new Promise(resolve => setTimeout(resolve, 0));
};

// Async utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const flushPromises = () => new Promise(setImmediate);

// Component testing utilities
export const expectElementToBeVisible = (text: string) =>
  expect(screen.getByText(text)).toBeInTheDocument();

export const expectElementNotToBeVisible = (text: string) =>
  expect(screen.queryByText(text)).not.toBeInTheDocument();

// Mock localStorage for components that might use it (even though artifacts can't)
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};