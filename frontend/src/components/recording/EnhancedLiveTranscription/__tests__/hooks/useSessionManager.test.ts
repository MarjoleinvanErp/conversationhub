import { renderHook, act } from '@testing-library/react';
import { useSessionManager } from '../../hooks/useSessionManager';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { SessionConfig, Participant } from '../../types';

// Mock the service
jest.mock('@/services/api/enhancedLiveTranscriptionService');
const mockService = enhancedLiveTranscriptionService as jest.Mocked<typeof enhancedLiveTranscriptionService>;

describe('useSessionManager Hook', () => {
  const mockMeetingId = 'test-meeting-123';
  const mockParticipants: Participant[] = [
    { id: '1', name: 'John Doe', color: '#FF5722' },
    { id: '2', name: 'Jane Smith', color: '#2196F3' }
  ];
  const mockConfig: SessionConfig = {
    live_webspeech_enabled: true,
    whisper_enabled: true,
    whisper_chunk_duration: 90,
    n8n_transcription_enabled: false,
    default_transcription_service: 'auto',
    available_services: { whisper: true, n8n: false }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useSessionManager({
        meetingId: mockMeetingId,
        participants: mockParticipants,
        config: mockConfig
      })
    );

    expect(result.current.sessionState).toEqual({
      sessionActive: false,
      sessionId: null,
      isStartingSession: false,
      startupProgress: '',
      error: null
    });
  });

  it('should successfully start a session', async () => {
    mockService.startEnhancedSession.mockResolvedValue({
      success: true,
      session_id: 'session-123'
    });

    const { result } = renderHook(() => 
      useSessionManager({
        meetingId: mockMeetingId,
        participants: mockParticipants,
        config: mockConfig
      })
    );

    let startResult: any;
    await act(async () => {
      startResult = await result.current.startSession(false);
    });

    expect(startResult).toEqual({
      success: true,
      sessionId: 'session-123'
    });

    expect(result.current.sessionState.sessionActive).toBe(true);
    expect(result.current.sessionState.sessionId).toBe('session-123');
  });

  it('should handle session start failure', async () => {
    mockService.startEnhancedSession.mockResolvedValue({
      success: false,
      error: 'Service unavailable'
    });

    const { result } = renderHook(() => 
      useSessionManager({
        meetingId: mockMeetingId,
        participants: mockParticipants,
        config: mockConfig
      })
    );

    let startResult: any;
    await act(async () => {
      startResult = await result.current.startSession(false);
    });

    expect(startResult).toEqual({
      success: false,
      error: 'Service unavailable'
    });

    expect(result.current.sessionState.error).toBe('Service unavailable');
  });
});

// frontend/src/components/recording/EnhancedLiveTranscription/__tests__/hooks/useTranscriptionProcessor.test.ts

import { renderHook, act } from '@testing-library/react';
import { useTranscriptionProcessor } from '../../hooks/useTranscriptionProcessor';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';
import type { SessionConfig, LiveTranscription } from '../../types';

jest.mock('@/services/api/enhancedLiveTranscriptionService');
const mockService = enhancedLiveTranscriptionService as jest.Mocked<typeof enhancedLiveTranscriptionService>;

describe('useTranscriptionProcessor Hook', () => {
  const mockConfig: SessionConfig = {
    live_webspeech_enabled: true,
    whisper_enabled: true,
    whisper_chunk_duration: 90,
    n8n_transcription_enabled: false,
    default_transcription_service: 'whisper',
    available_services: { whisper: true, n8n: false }
  };

  const mockTranscriptionReceived = jest.fn();
  const mockWhisperReceived = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useTranscriptionProcessor({
        sessionId: 'test-session',
        config: mockConfig,
        onTranscriptionReceived: mockTranscriptionReceived,
        onWhisperReceived: mockWhisperReceived
      })
    );

    expect(result.current.sessionStats).toEqual({
      totalDuration: 0,
      chunksProcessed: 0,
      transcriptionsReceived: 0,
      whisperCalls: 0,
      averageConfidence: 0,
      activeService: 'whisper',
      errorCount: 0
    });
  });

  it('should process audio chunk successfully', async () => {
    const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });
    const mockTranscription: LiveTranscription = {
      id: 'trans-1',
      text: 'Test transcription',
      speaker_name: 'John Doe',
      speaker_id: 'participant_1',
      speaker_color: '#FF5722',
      confidence: 0.95,
      spoken_at: new Date().toISOString(),
      source: 'whisper',
      processing_status: 'completed'
    };

    mockService.processChunk.mockResolvedValue({
      success: true,
      transcription: mockTranscription
    });

    const { result } = renderHook(() => 
      useTranscriptionProcessor({
        sessionId: 'test-session',
        config: mockConfig,
        onTranscriptionReceived: mockTranscriptionReceived,
        onWhisperReceived: mockWhisperReceived
      })
    );

    await act(async () => {
      await result.current.processAudioChunk(mockAudioBlob);
    });

    expect(result.current.sessionStats.chunksProcessed).toBe(1);
    expect(result.current.sessionStats.transcriptionsReceived).toBe(1);
    expect(mockWhisperReceived).toHaveBeenCalledWith(mockTranscription);
  });

  it('should reset statistics correctly', () => {
    const { result } = renderHook(() => 
      useTranscriptionProcessor({
        sessionId: 'test-session',
        config: mockConfig,
        onTranscriptionReceived: mockTranscriptionReceived,
        onWhisperReceived: mockWhisperReceived
      })
    );

    act(() => {
      result.current.resetStats();
    });

    expect(result.current.sessionStats).toEqual({
      totalDuration: 0,
      chunksProcessed: 0,
      transcriptionsReceived: 0,
      whisperCalls: 0,
      averageConfidence: 0,
      activeService: 'whisper',
      errorCount: 0
    });
  });
});