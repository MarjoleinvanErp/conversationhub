import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioRecorder from './AudioRecorder';
import type { AudioChunk } from '@/types';

// ===== MOCKS =====

const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  onstop: null as ((event: any) => void) | null,
  state: 'inactive' as RecordingState,
  mimeType: 'audio/webm;codecs=opus'
};

const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
  getAudioTracks: () => [{ stop: jest.fn() }]
};

// Setup global mocks
beforeAll(() => {
  // Mock MediaRecorder with all required static methods
  const MockMediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
  MockMediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);
  global.MediaRecorder = MockMediaRecorder as any;

  // Mock getUserMedia
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(mockStream)
    },
    writable: true
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMediaRecorder.state = 'inactive';
});

// ===== MOCK FUNCTIONS =====

const mockOnAudioChunk = jest.fn();
const mockOnError = jest.fn();
const mockOnToggleRecording = jest.fn();

// ===== TESTS =====

describe('AudioRecorder', () => {
  test('renders recording button', () => {
    render(
      <AudioRecorder 
        onAudioChunk={mockOnAudioChunk}
        onError={mockOnError}
        isRecording={false}
        onToggleRecording={mockOnToggleRecording}
      />
    );
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });

  test('starts recording when button clicked', async () => {
    render(
      <AudioRecorder 
        onAudioChunk={mockOnAudioChunk}
        onError={mockOnError}
        isRecording={false}
        onToggleRecording={mockOnToggleRecording}
      />
    );
    const startButton = screen.getByRole('button', { name: /start recording/i });
    
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(global.MediaRecorder).toHaveBeenCalled();
    });
  });

  test('should handle data available events', async () => {
    const { getByRole } = render(
      <AudioRecorder 
        onAudioChunk={mockOnAudioChunk}
        onError={mockOnError}
        isRecording={false}
        onToggleRecording={mockOnToggleRecording}
      />
    );
    const startButton = getByRole('button', { name: /start recording/i });
    
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(global.MediaRecorder).toHaveBeenCalled();
    });

    // Create mock event
    const mockEvent = {
      data: new Blob(['test'], { type: 'audio/webm' })
    };

    // Trigger the event handler if it exists
    if (mockMediaRecorder.ondataavailable) {
      mockMediaRecorder.ondataavailable(mockEvent);
    }

    await waitFor(() => {
      expect(mockOnAudioChunk).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  test('should handle recording errors', async () => {
    const { getByRole } = render(
      <AudioRecorder 
        onAudioChunk={mockOnAudioChunk}
        onError={mockOnError}
        isRecording={false}
        onToggleRecording={mockOnToggleRecording}
      />
    );
    const startButton = getByRole('button', { name: /start recording/i });
    
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(global.MediaRecorder).toHaveBeenCalled();
    });

    // Create mock error event
    const mockError = {
      error: new Error('Recording failed')
    };

    // Trigger the error handler if it exists
    if (mockMediaRecorder.onerror) {
      mockMediaRecorder.onerror(mockError);
    }

    await waitFor(() => {
      expect(screen.getByText(/recording error/i)).toBeInTheDocument();
    });
  });

  test('stops recording when stop button clicked', async () => {
    render(
      <AudioRecorder 
        onAudioChunk={mockOnAudioChunk}
        onError={mockOnError}
        isRecording={true}
        onToggleRecording={mockOnToggleRecording}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });
  });

  test('handles microphone permission denied', async () => {
    // Mock getUserMedia to reject
    const mockGetUserMedia = jest.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true
    });

    render(
      <AudioRecorder 
        onAudioChunk={mockOnAudioChunk}
        onError={mockOnError}
        isRecording={false}
        onToggleRecording={mockOnToggleRecording}
      />
    );
    const startButton = screen.getByRole('button', { name: /start recording/i });
    
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    });
  });
});