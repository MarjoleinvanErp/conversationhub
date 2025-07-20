// frontend/src/services/__tests__/enhancedLiveTranscriptionService.test.ts

import { jest } from '@jest/globals';
import enhancedLiveTranscriptionService from '../enhancedLiveTranscriptionService';
import apiClient from '../apiClient';
import type { 
  TranscriptionConfig, 
  ServiceTestResults, 
  ProcessChunkResult,
  ProcessChunkOptions 
} from '../../types/n8n';

// Mock the API client
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock browser APIs
const mockGetUserMedia = jest.fn();
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  ondataavailable: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  state: 'inactive'
};

const mockSpeechRecognition = {
  continuous: true,
  interimResults: true,
  lang: 'nl-NL',
  onresult: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  onend: null as ((event: any) => void) | null,
  start: jest.fn(),
  stop: jest.fn()
};

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia }
});

(global as any).MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
(global as any).MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);

(global as any).SpeechRecognition = jest.fn().mockImplementation(() => mockSpeechRecognition);
(global as any).webkitSpeechRecognition = (global as any).SpeechRecognition;

// Mock FileReader for audio chunk processing
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:audio/webm;base64,dGVzdGF1ZGlvZGF0YQ==', // 'testaudiodata' in base64
  onload: null as (() => void) | null,
  onerror: null as ((error: any) => void) | null
};

(global as any).FileReader = jest.fn().mockImplementation(() => mockFileReader);

describe('EnhancedLiveTranscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service state
    enhancedLiveTranscriptionService.stopRecording();
    
    // Setup default mock implementations
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
      getAudioTracks: () => [{ stop: jest.fn() }]
    });

    // Setup FileReader mock
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload();
        }
      }, 0);
    });
  });

  describe('getConfig', () => {
    it('should fetch transcription configuration successfully', async () => {
      const mockConfig: TranscriptionConfig = {
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
        n8n_webhook_configured: true
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockConfig
        }
      });

      const result = await enhancedLiveTranscriptionService.getConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/transcription/config');
      expect(result).toEqual(mockConfig);
    });

    it('should handle configuration fetch failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(enhancedLiveTranscriptionService.getConfig())
        .rejects.toThrow('Network error');
    });
  });

  describe('testServices', () => {
    it('should test available transcription services', async () => {
      const mockResults: ServiceTestResults = {
        whisper: {
          available: true,
          status: 'Whisper service configured'
        },
        n8n: {
          available: true,
          status: 'Connected',
          success: true,
          response_time: 150
        }
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResults
        }
      });

      const result = await enhancedLiveTranscriptionService.testServices();

      expect(mockApiClient.post).toHaveBeenCalledWith('/transcription/test-services');
      expect(result).toEqual(mockResults);
    });

    it('should handle service test failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Service test failed'));

      await expect(enhancedLiveTranscriptionService.testServices())
        .rejects.toThrow('Service test failed');
    });
  });

  describe('startRecording', () => {
    it('should start recording successfully with all features', async () => {
      const mockOptions = {
        sessionId: 'test-session-123',
        onTranscription: jest.fn(),
        onError: jest.fn()
      };

      const result = await enhancedLiveTranscriptionService.startRecording(mockOptions);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('test-session-123');
      expect(result.features).toEqual({
        mediaRecorder: true,
        speechRecognition: true,
        audioStream: true
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should handle microphone access denial', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const result = await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should work without speech recognition if not supported', async () => {
      // Remove speech recognition support
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;

      const result = await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      expect(result.success).toBe(true);
      expect(result.features?.speechRecognition).toBe(false);
      expect(result.features?.mediaRecorder).toBe(true);
      expect(result.features?.audioStream).toBe(true);

      // Restore for other tests
      (global as any).SpeechRecognition = jest.fn().mockImplementation(() => mockSpeechRecognition);
      (global as any).webkitSpeechRecognition = (global as any).SpeechRecognition;
    });
  });

  describe('processChunk', () => {
    it('should process audio chunk with N8N service successfully', async () => {
      const mockOptions: ProcessChunkOptions = {
        audioData: 'dGVzdGF1ZGlvZGF0YQ==', // base64 test data
        sessionId: 'test-session-123',
        preferredService: 'n8n',
        useN8N: true
      };

      const mockResult: ProcessChunkResult = {
        success: true,
        transcription: {
          id: 1,
          text: 'Test transcription from N8N',
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
            text: 'Test transcription from N8N',
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
        }
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: mockResult
        }
      });

      const result = await enhancedLiveTranscriptionService.processChunk(mockOptions);

      expect(mockApiClient.post).toHaveBeenCalledWith('/transcription/live', {
        audio_data: 'dGVzdGF1ZGlvZGF0YQ==',
        session_id: 'test-session-123',
        preferred_service: 'n8n',
        use_n8n: true
      });

      expect(result.success).toBe(true);
      expect(result.transcription?.source).toBe('n8n');
      expect(result.primary_source).toBe('n8n');
      expect(result.transcriptions).toHaveLength(1);
    });

    it('should handle chunk processing failure', async () => {
      const mockOptions: ProcessChunkOptions = {
        audioData: 'dGVzdGF1ZGlvZGF0YQ==',
        sessionId: 'test-session-123',
        preferredService: 'n8n',
        useN8N: true
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: false,
          error: 'N8N service temporarily unavailable'
        }
      });

      const result = await enhancedLiveTranscriptionService.processChunk(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('N8N service temporarily unavailable');
    });

    it('should handle network errors gracefully', async () => {
      const mockOptions: ProcessChunkOptions = {
        audioData: 'dGVzdGF1ZGlvZGF0YQ==',
        sessionId: 'test-session-123'
      };

      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await enhancedLiveTranscriptionService.processChunk(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should throw error when no audio data provided', async () => {
      const mockOptions: ProcessChunkOptions = {
        audioData: '',
        sessionId: 'test-session-123'
      };

      const result = await enhancedLiveTranscriptionService.processChunk(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No audio data provided');
    });
  });

  describe('getAudioChunk', () => {
    it('should return null when no audio chunks available', async () => {
      const result = await enhancedLiveTranscriptionService.getAudioChunk();
      expect(result).toBeNull();
    });

    it('should process audio chunks into base64 data', async () => {
      // Start recording to initialize MediaRecorder
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      // Simulate audio data available
      const mockBlob = new Blob(['fake-audio-data'], { type: 'audio/webm' });
      
      // Manually trigger ondataavailable to add chunks
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockBlob });
      }

      const result = await enhancedLiveTranscriptionService.getAudioChunk();
      
      expect(result).toBe('dGVzdGF1ZGlvZGF0YQ'); // base64 of 'testaudiodata'
      expect(mockFileReader.readAsDataURL).toHaveBeenCalled();
    });

    it('should handle FileReader errors gracefully', async () => {
      // Start recording
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      // Add audio chunk
      const mockBlob = new Blob(['fake-audio-data'], { type: 'audio/webm' });
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockBlob });
      }

      // Mock FileReader error
      mockFileReader.readAsDataURL.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onerror) {
            mockFileReader.onerror(new Error('FileReader error'));
          }
        }, 0);
      });

      const result = await enhancedLiveTranscriptionService.getAudioChunk();
      expect(result).toBeNull();
    });
  });

  describe('setPreferredService', () => {
    it('should set preferred service for session', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            session_id: 'test-session-123',
            preferred_service: 'n8n'
          }
        }
      });

      const result = await enhancedLiveTranscriptionService.setPreferredService(
        'test-session-123',
        'n8n'
      );

      expect(mockApiClient.post).toHaveBeenCalledWith('/transcription/preferred-service', {
        session_id: 'test-session-123',
        service: 'n8n'
      });

      expect(result.session_id).toBe('test-session-123');
      expect(result.preferred_service).toBe('n8n');
    });

    it('should handle set preferred service failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API error'));

      await expect(enhancedLiveTranscriptionService.setPreferredService('test-session', 'n8n'))
        .rejects.toThrow('API error');
    });
  });

  describe('getPreferredService', () => {
    it('should get preferred service for session', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            preferred_service: 'n8n'
          }
        }
      });

      const result = await enhancedLiveTranscriptionService.getPreferredService('test-session-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/transcription/preferred-service', {
        params: { session_id: 'test-session-123' }
      });

      expect(result).toBe('n8n');
    });

    it('should handle get preferred service failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Session not found'));

      await expect(enhancedLiveTranscriptionService.getPreferredService('invalid-session'))
        .rejects.toThrow('Session not found');
    });
  });

  describe('pauseRecording and resumeRecording', () => {
    beforeEach(async () => {
      // Start recording first
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });
    });

    it('should pause recording correctly', () => {
      enhancedLiveTranscriptionService.pauseRecording();

      expect(mockMediaRecorder.pause).toHaveBeenCalled();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      
      const status = enhancedLiveTranscriptionService.getStatus();
      expect(status.isPaused).toBe(true);
    });

    it('should resume recording correctly', () => {
      // First pause
      enhancedLiveTranscriptionService.pauseRecording();
      
      // Then resume
      enhancedLiveTranscriptionService.resumeRecording();

      expect(mockMediaRecorder.resume).toHaveBeenCalled();
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2); // Once on start, once on resume
      
      const status = enhancedLiveTranscriptionService.getStatus();
      expect(status.isPaused).toBe(false);
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and clean up resources', async () => {
      const mockStream = {
        getTracks: () => [{ stop: jest.fn() }]
      };

      mockGetUserMedia.mockResolvedValue(mockStream);

      // Start recording
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      // Stop recording
      enhancedLiveTranscriptionService.stopRecording();

      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();

      const status = enhancedLiveTranscriptionService.getStatus();
      expect(status.isRecording).toBe(false);
      expect(status.hasAudioStream).toBe(false);
    });
  });

  describe('isActivelyRecording', () => {
    it('should return false when not recording', () => {
      expect(enhancedLiveTranscriptionService.isActivelyRecording()).toBe(false);
    });

    it('should return true when recording and not paused', async () => {
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      expect(enhancedLiveTranscriptionService.isActivelyRecording()).toBe(true);
    });

    it('should return false when recording but paused', async () => {
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      enhancedLiveTranscriptionService.pauseRecording();

      expect(enhancedLiveTranscriptionService.isActivelyRecording()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when idle', () => {
      const status = enhancedLiveTranscriptionService.getStatus();

      expect(status).toEqual({
        isRecording: false,
        isPaused: false,
        hasAudioStream: false,
        hasMediaRecorder: false,
        hasSpeechRecognition: false,
        audioChunksCount: 0
      });
    });

    it('should return correct status when recording', async () => {
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      const status = enhancedLiveTranscriptionService.getStatus();

      expect(status.isRecording).toBe(true);
      expect(status.hasAudioStream).toBe(true);
      expect(status.hasMediaRecorder).toBe(true);
      expect(status.hasSpeechRecognition).toBe(true);
    });
  });

  describe('speech recognition integration', () => {
    it('should handle speech recognition results correctly', async () => {
      const mockOnTranscription = jest.fn();

      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: mockOnTranscription,
        onError: jest.fn()
      });

      // Simulate speech recognition result
      const mockEvent = {
        resultIndex: 0,
        results: [{
          0: { 
            transcript: 'Test speech recognition', 
            confidence: 0.87 
          },
          isFinal: true
        }]
      };

      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }

      expect(mockOnTranscription).toHaveBeenCalledWith({
        transcript: 'Test speech recognition',
        confidence: 0.87,
        isFinal: true,
        timestamp: expect.any(Date)
      });
    });

    it('should handle speech recognition errors', async () => {
      const mockOnError = jest.fn();

      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: mockOnError
      });

      // Simulate speech recognition error
      const mockErrorEvent = {
        error: 'no-speech'
      };

      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror(mockErrorEvent);
      }

      // Should attempt to restart recognition for non-fatal errors
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(1); // Initial start
    });

    it('should restart speech recognition on end event', async () => {
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      // Simulate speech recognition end
      if (mockSpeechRecognition.onend) {
        mockSpeechRecognition.onend();
      }

      // Should restart recognition
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2); // Initial + restart
    });
  });

  describe('MediaRecorder integration', () => {
    it('should handle MediaRecorder data available events', async () => {
      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: jest.fn()
      });

      // Simulate data available
      const mockBlob = new Blob(['audio-data'], { type: 'audio/webm' });
      
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: mockBlob });
      }

      const status = enhancedLiveTranscriptionService.getStatus();
      expect(status.audioChunksCount).toBe(1);
    });

    it('should handle MediaRecorder errors', async () => {
      const mockOnError = jest.fn();

      await enhancedLiveTranscriptionService.startRecording({
        sessionId: 'test-session',
        onTranscription: jest.fn(),
        onError: mockOnError
      });

      // Simulate MediaRecorder error
      const mockErrorEvent = {
        error: new Error('MediaRecorder failed')
      };

      if (mockMediaRecorder.onerror) {
        mockMediaRecorder.onerror(mockErrorEvent);
      }

      expect(mockOnError).toHaveBeenCalledWith('MediaRecorder error: MediaRecorder failed');
    });
  });
});