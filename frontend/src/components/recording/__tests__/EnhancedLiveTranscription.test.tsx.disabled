// frontend/src/components/recording/__tests__/EnhancedLiveTranscription.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import EnhancedLiveTranscription from '../EnhancedLiveTranscription';
import enhancedLiveTranscriptionService from '../../../services/enhancedLiveTranscriptionService';
import configService from '../../../services/configService';
import type { TranscriptionConfig, ServiceTestResults, ProcessChunkResult } from '../../../types/n8n';

// Mock the services
jest.mock('../../../services/enhancedLiveTranscriptionService');
jest.mock('../../../services/configService');

const mockEnhancedService = enhancedLiveTranscriptionService as jest.Mocked<typeof enhancedLiveTranscriptionService>;
const mockConfigService = configService as jest.Mocked<typeof configService>;

// Mock MediaDevices
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia }
});

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  ondataavailable: null,
  onerror: null,
  state: 'inactive'
};

(global as any).MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
(global as any).MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);

describe('EnhancedLiveTranscription', () => {
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

  const mockServiceStatus: ServiceTestResults = {
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

  const mockOnTranscriptionUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockConfigService.getAllConfig.mockResolvedValue({
      transcription: mockConfig,
      n8n: {
        auto_export_enabled: false,
        auto_export_interval_minutes: 10,
        webhook_url: 'http://test-n8n.com/webhook',
        api_key: 'test-key',
        transcription_enabled: true,
        transcription_webhook_url: 'http://test-n8n.com/transcription',
        timeout_seconds: 60
      },
      privacy: {
        filter_enabled: true,
        data_retention_days: 90,
        auto_delete_audio: true
      },
      azure: {
        whisper_configured: true
      }
    });

    mockEnhancedService.getConfig.mockResolvedValue(mockConfig);
    mockEnhancedService.testServices.mockResolvedValue(mockServiceStatus);
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    });
  });

  describe('Initial Render', () => {
    it('should render the component with default state', async () => {
      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      expect(screen.getByText('Live Transcriptie')).toBeInTheDocument();
      expect(screen.getByText('Klaar om op te nemen')).toBeInTheDocument();
      expect(screen.getByText('Start Opname')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockEnhancedService.getConfig).toHaveBeenCalled();
        expect(mockEnhancedService.testServices).toHaveBeenCalled();
      });
    });

    it('should display service status indicators', async () => {
      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      await waitFor(() => {
        expect(screen.getByText('WHISPER')).toBeInTheDocument();
        expect(screen.getByText('N8N')).toBeInTheDocument();
      });
    });

    it('should show settings button', () => {
      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      const settingsButton = screen.getByTitle('Transcriptie instellingen');
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('Service Selection', () => {
    it('should toggle service selector when settings clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      const settingsButton = screen.getByTitle('Transcriptie instellingen');
      
      // Service selector should not be visible initially
      expect(screen.queryByText('Transcriptie Service')).not.toBeInTheDocument();

      // Click settings to show selector
      await user.click(settingsButton);
      expect(screen.getByText('Transcriptie Service')).toBeInTheDocument();

      // Click again to hide
      await user.click(settingsButton);
      expect(screen.queryByText('Transcriptie Service')).not.toBeInTheDocument();
    });

    it('should allow selecting different transcription services', async () => {
      const user = userEvent.setup();
      mockEnhancedService.setPreferredService.mockResolvedValue({
        session_id: 'test-session',
        preferred_service: 'n8n'
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Open service selector
      const settingsButton = screen.getByTitle('Transcriptie instellingen');
      await user.click(settingsButton);

      // Select N8N service
      const n8nButton = screen.getByText('N8n');
      await user.click(n8nButton);

      await waitFor(() => {
        expect(mockEnhancedService.setPreferredService).toHaveBeenCalledWith(
          expect.stringMatching(/^session_/),
          'n8n'
        );
      });
    });

    it('should disable unavailable services', async () => {
      const user = userEvent.setup();
      
      // Mock N8N as unavailable
      const unavailableServiceStatus: ServiceTestResults = {
        whisper: {
          available: true,
          status: 'Whisper service configured'
        },
        n8n: {
          available: false,
          status: 'Connection failed',
          success: false,
          error: 'Webhook not reachable'
        }
      };

      mockEnhancedService.testServices.mockResolvedValue(unavailableServiceStatus);

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Open service selector
      const settingsButton = screen.getByTitle('Transcriptie instellingen');
      await user.click(settingsButton);

      await waitFor(() => {
        const n8nButton = screen.getByText('N8n');
        expect(n8nButton).toBeDisabled();
      });
    });
  });

  describe('Recording Controls', () => {
    it('should start recording when start button clicked', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockEnhancedService.startRecording).toHaveBeenCalledWith({
          sessionId: expect.stringMatching(/^session_/),
          onTranscription: expect.any(Function),
          onError: expect.any(Function)
        });
      });

      // Should show pause and stop buttons
      expect(screen.getByText('Pauzeer')).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.queryByText('Start Opname')).not.toBeInTheDocument();
    });

    it('should handle recording start failure', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: false,
        error: 'Microphone access denied'
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
      });
    });

    it('should pause and resume recording', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      await waitFor(() => {
        expect(screen.getByText('Pauzeer')).toBeInTheDocument();
      });

      // Pause recording
      await user.click(screen.getByText('Pauzeer'));
      expect(mockEnhancedService.pauseRecording).toHaveBeenCalled();
      expect(screen.getByText('Hervat')).toBeInTheDocument();

      // Resume recording
      await user.click(screen.getByText('Hervat'));
      expect(mockEnhancedService.resumeRecording).toHaveBeenCalled();
      expect(screen.getByText('Pauzeer')).toBeInTheDocument();
    });

    it('should stop recording', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      await waitFor(() => {
        expect(screen.getByText('Stop')).toBeInTheDocument();
      });

      // Stop recording
      await user.click(screen.getByText('Stop'));
      expect(mockEnhancedService.stopRecording).toHaveBeenCalled();
      expect(screen.getByText('Start Opname')).toBeInTheDocument();
    });
  });

  describe('Chunk Processing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process audio chunks at regular intervals', async () => {
      const user = userEvent.setup();
      
      const mockProcessResult: ProcessChunkResult = {
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
        primary_source: 'n8n',
        session_stats: {
          total_chunks: 1,
          voice_setup_complete: true,
          n8n_enabled: true,
          whisper_enabled: true
        }
      };

      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      mockEnhancedService.getAudioChunk.mockResolvedValue('base64audiodata');
      mockEnhancedService.processChunk.mockResolvedValue(mockProcessResult);

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      // Fast-forward time to trigger chunk processing
      act(() => {
        jest.advanceTimersByTime(90000); // 90 seconds
      });

      await waitFor(() => {
        expect(mockEnhancedService.processChunk).toHaveBeenCalledWith({
          audioData: 'base64audiodata',
          sessionId: expect.stringMatching(/^session_/),
          preferredService: 'auto',
          useN8N: false
        });
      });
    });

    it('should display processed transcriptions', async () => {
      const user = userEvent.setup();
      
      const mockProcessResult: ProcessChunkResult = {
        success: true,
        transcriptions: [
          {
            id: 1,
            text: 'First speaker segment',
            speaker_name: 'Spreker A',
            speaker_id: 'SPEAKER_00',
            speaker_color: '#3B82F6',
            confidence: 0.95,
            speaker_confidence: 0.92,
            spoken_at: new Date().toISOString(),
            source: 'n8n',
            processing_status: 'completed'
          },
          {
            id: 2,
            text: 'Second speaker segment',
            speaker_name: 'Spreker B',
            speaker_id: 'SPEAKER_01',
            speaker_color: '#EF4444',
            confidence: 0.93,
            speaker_confidence: 0.89,
            spoken_at: new Date().toISOString(),
            source: 'n8n',
            processing_status: 'completed'
          }
        ],
        primary_source: 'n8n'
      };

      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      mockEnhancedService.getAudioChunk.mockResolvedValue('base64audiodata');
      mockEnhancedService.processChunk.mockResolvedValue(mockProcessResult);

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      // Trigger chunk processing
      act(() => {
        jest.advanceTimersByTime(90000);
      });

      await waitFor(() => {
        expect(screen.getByText('First speaker segment')).toBeInTheDocument();
        expect(screen.getByText('Second speaker segment')).toBeInTheDocument();
        expect(screen.getByText('Spreker A')).toBeInTheDocument();
        expect(screen.getByText('Spreker B')).toBeInTheDocument();
      });

      // Should call transcription update callback
      expect(mockOnTranscriptionUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Live Speech Recognition', () => {
    it('should handle live speech recognition results', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockImplementation(({ onTranscription }) => {
        // Simulate live transcription after a delay
        setTimeout(() => {
          onTranscription({
            transcript: 'Live speech recognition test',
            confidence: 0.87,
            isFinal: true,
            timestamp: new Date()
          });
        }, 100);

        return Promise.resolve({
          success: true,
          sessionId: 'test-session',
          features: {
            mediaRecorder: true,
            speechRecognition: true,
            audioStream: true
          }
        });
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      await waitFor(() => {
        expect(screen.getByText('Live speech recognition test')).toBeInTheDocument();
        expect(screen.getByText('Live Spreker')).toBeInTheDocument();
      });

      expect(mockOnTranscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Live speech recognition test',
          speaker_name: 'Live Spreker',
          source: 'live',
          isLive: true
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should display configuration loading errors', async () => {
      mockEnhancedService.getConfig.mockRejectedValue(new Error('Config load failed'));

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load configuration')).toBeInTheDocument();
      });
    });

    it('should handle chunk processing errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      mockEnhancedService.getAudioChunk.mockResolvedValue('base64audiodata');
      mockEnhancedService.processChunk.mockResolvedValue({
        success: false,
        error: 'N8N service temporarily unavailable'
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      // Trigger chunk processing
      act(() => {
        jest.advanceTimersByTime(90000);
      });

      // Should handle error gracefully without crashing
      await waitFor(() => {
        expect(mockEnhancedService.processChunk).toHaveBeenCalled();
      });

      // Component should still be functional
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should show recording statistics during active recording', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      await waitFor(() => {
        expect(screen.getByText('Statistieken')).toBeInTheDocument();
        expect(screen.getByText('Opnameduur:')).toBeInTheDocument();
        expect(screen.getByText('Chunks verwerkt:')).toBeInTheDocument();
        expect(screen.getByText('Transcripties:')).toBeInTheDocument();
        expect(screen.getByText('Service:')).toBeInTheDocument();
      });
    });

    it('should update duration counter during recording', async () => {
      const user = userEvent.setup();
      
      mockEnhancedService.startRecording.mockResolvedValue({
        success: true,
        sessionId: 'test-session',
        features: {
          mediaRecorder: true,
          speechRecognition: true,
          audioStream: true
        }
      });

      render(<EnhancedLiveTranscription conversationId={1} onTranscriptionUpdate={mockOnTranscriptionUpdate} />);

      // Start recording
      await user.click(screen.getByText('Start Opname'));

      // Initially should show 0:00
      expect(screen.getByText('0:00')).toBeInTheDocument();

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });

      await waitFor(() => {
        expect(screen.getByText('0:05')).toBeInTheDocument();
      });
    });
  });
});