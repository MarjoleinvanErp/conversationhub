import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioRecorder from './AudioRecorder';

// ===== COMPLETE MOCK SETUP =====

interface MockMediaRecorder {
  state: string;
  start: jest.Mock;
  stop: jest.Mock;
  pause: jest.Mock;
  resume: jest.Mock;
  ondataavailable: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onstart: ((event: any) => void) | null;
  onstop: ((event: any) => void) | null;
}

interface MockMediaStream {
  getTracks: () => Array<{ stop: jest.Mock }>;
  getAudioTracks: () => Array<{ stop: jest.Mock }>;
}

// Global mock variables
let mockMediaRecorder: MockMediaRecorder;
let mockMediaStream: MockMediaStream;

beforeEach(() => {
  jest.clearAllMocks();
  
  // Create proper mock MediaRecorder
  mockMediaRecorder = {
    state: 'inactive',
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    ondataavailable: null,
    onerror: null,
    onstart: null,
    onstop: null
  };

  // Create proper mock MediaStream
  mockMediaStream = {
    getTracks: () => [{ stop: jest.fn() }],
    getAudioTracks: () => [{ stop: jest.fn() }]
  };

  // Mock MediaRecorder constructor
  global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder) as any;
  (global.MediaRecorder as any).isTypeSupported = jest.fn().mockReturnValue(true);

  // Mock navigator.mediaDevices
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
    },
    writable: true
  });
});

// ===== TEST HELPER FUNCTIONS =====

const mockOnAudioData = jest.fn();

// ===== TESTS =====

describe('AudioRecorder', () => {
  test('renders recording button', () => {
    render(<AudioRecorder onAudioData={mockOnAudioData} />);
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });

  test('starts recording when button clicked', async () => {
    render(<AudioRecorder onAudioData={mockOnAudioData} />);
    const startButton = screen.getByRole('button', { name: /start recording/i });
    
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(global.MediaRecorder).toHaveBeenCalled();
    });
  });

  test('should handle data available events', async () => {
    const { getByRole } = render(<AudioRecorder onAudioData={mockOnAudioData} />);
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
      expect(mockOnAudioData).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  test('should handle recording errors', async () => {
    const { getByRole } = render(<AudioRecorder onAudioData={mockOnAudioData} />);
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
    render(<AudioRecorder onAudioData={mockOnAudioData} />);
    
    // Start recording first
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);
    
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

    render(<AudioRecorder onAudioData={mockOnAudioData} />);
    const startButton = screen.getByRole('button', { name: /start recording/i });
    
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    });
  });
});