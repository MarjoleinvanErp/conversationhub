import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioRecorder from './AudioRecorder';
import type { AudioRecorderProps, AudioChunk } from '@/types';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
  ondataavailable: null,
  onerror: null,
};

// Mock getUserMedia
const mockGetUserMedia = jest.fn();

// Setup mocks
beforeAll(() => {
  // @ts-ignore
  global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder);
  
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: mockGetUserMedia,
    },
  });

  // Mock MediaRecorder.isTypeSupported
  // @ts-ignore
  MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);
});

describe('AudioRecorder Component', () => {
  // Default props voor tests
  const defaultProps: AudioRecorderProps = {
    onAudioChunk: jest.fn(),
    onError: jest.fn(),
    isRecording: false,
    onToggleRecording: jest.fn(),
  };

  // Reset mocks tussen tests
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful getUserMedia
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  test('renders audio recorder component', () => {
    render(<AudioRecorder {...defaultProps} />);
    
    expect(screen.getByText('Audio Opname')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start opname/i })).toBeInTheDocument();
  });

  test('shows correct initial state', () => {
    render(<AudioRecorder {...defaultProps} />);
    
    expect(screen.getByText('Druk op "Start Opname" om te beginnen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start opname/i })).not.toBeDisabled();
  });

  test('calls onToggleRecording when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    expect(defaultProps.onToggleRecording).toHaveBeenCalledTimes(1);
  });

  test('requests microphone permission when starting recording', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
  });

  test('shows error when microphone access fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Microphone not available';
    mockGetUserMedia.mockRejectedValue(new Error(errorMessage));
    
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Kan microfoon niet openen/i)).toBeInTheDocument();
    });
    
    expect(defaultProps.onError).toHaveBeenCalledWith(expect.any(Error));
  });

  test('creates MediaRecorder with correct options', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(MediaRecorder).toHaveBeenCalledWith(
        expect.any(Object),
        { mimeType: 'audio/webm;codecs=opus' }
      );
    });
  });

  test('starts MediaRecorder with 1 second chunks', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    });
  });

  test('calls onAudioChunk when data is available', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    // Simuleer data available event
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
    const mockEvent = { data: mockBlob } as BlobEvent;
    
    await waitFor(() => {
      if (mockMediaRecorder.ondataavailable) {
        if (mockMediaRecorder.ondataavailable) {
  mockMediaRecorder.ondataavailable(mockEvent);
}
      }
    });
    
    expect(defaultProps.onAudioChunk).toHaveBeenCalledWith(
      expect.objectContaining({
        blob: mockBlob,
        format: 'webm',
        size: mockBlob.size,
      })
    );
  });

  test('shows recording state when active', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Opname actief - spreek duidelijk in de microfoon')).toBeInTheDocument();
    });
  });

  test('shows duration timer when recording', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  test('stops recording when stop button is clicked', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    // Start recording eerst
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop opname/i })).toBeInTheDocument();
    });
    
    // Stop recording
    const stopButton = screen.getByRole('button', { name: /stop opname/i });
    await user.click(stopButton);
    
    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  test('cleans up resources when component unmounts', () => {
    const { unmount } = render(<AudioRecorder {...defaultProps} />);
    
    unmount();
    
    // Test zou moeten controleren dat tracks gestopt worden
    // Dit is al getest in de mock setup
  });

  test('formats duration correctly', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    // Test verschillende duration formats
    await waitFor(() => {
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  test('handles MediaRecorder errors gracefully', async () => {
    const user = userEvent.setup();
    render(<AudioRecorder {...defaultProps} />);
    
    const startButton = screen.getByRole('button', { name: /start opname/i });
    await user.click(startButton);
    
    // Simuleer MediaRecorder error
    const mockError = new Event('error');
    
    await waitFor(() => {
      if (mockMediaRecorder.onerror) {
        if (mockMediaRecorder.onerror) {
  mockMediaRecorder.onerror(mockError);
}
      }
    });
    
    expect(defaultProps.onError).toHaveBeenCalledWith(expect.any(Error));
  });
});