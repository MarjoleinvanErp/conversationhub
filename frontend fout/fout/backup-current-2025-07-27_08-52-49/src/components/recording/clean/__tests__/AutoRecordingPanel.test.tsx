import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AutoRecordingPanel from '../AutoRecordingPanel';
import { MeetingParticipant } from '../types';

// Mock global fetch
global.fetch = jest.fn();

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstart: null,
  onstop: null,
  onerror: null,
};

// Fixed MediaRecorder constructor with isTypeSupported
const MockMediaRecorderConstructor = jest.fn().mockImplementation(() => mockMediaRecorder);
MockMediaRecorderConstructor.isTypeSupported = jest.fn().mockReturnValue(true);
global.MediaRecorder = MockMediaRecorderConstructor as any;

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Test data
const mockParticipants: MeetingParticipant[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Moderator',
    status: 'online',
    color: '#3B82F6'
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Participant',
    status: 'online',
    color: '#10B981'
  }
];

const defaultProps = {
  meetingId: 'test-meeting-123',
  isExpanded: true,
  onToggleExpand: jest.fn(),
  participants: mockParticipants
};

// Helper to create mock MediaStream
const createMockMediaStream = () => ({
  getTracks: jest.fn().mockReturnValue([
    { stop: jest.fn() }
  ]),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

describe('AutoRecordingPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    mockGetUserMedia.mockClear();
    
    // Reset MediaRecorder mock
    mockMediaRecorder.state = 'inactive';
    mockMediaRecorder.start.mockClear();
    mockMediaRecorder.stop.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    test('renders collapsed panel correctly', () => {
      render(
        <AutoRecordingPanel 
          {...defaultProps} 
          isExpanded={false} 
        />
      );

      expect(screen.getByText('Automatische Opname')).toBeInTheDocument();
      expect(screen.getByText('Real-time transcriptie met N8N')).toBeInTheDocument();
      expect(screen.queryByText('Start Opname')).not.toBeInTheDocument();
    });

    test('renders expanded panel correctly', () => {
      render(<AutoRecordingPanel {...defaultProps} />);

      expect(screen.getByText('Automatische Opname')).toBeInTheDocument();
      expect(screen.getByText('Start Opname')).toBeInTheDocument();
      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getByText('Deelnemers (2)')).toBeInTheDocument();
    });

    test('shows participants correctly', () => {
      render(<AutoRecordingPanel {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('(Moderator)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('(Participant)')).toBeInTheDocument();
    });

    test('handles empty participants list', () => {
      render(
        <AutoRecordingPanel 
          {...defaultProps} 
          participants={[]} 
        />
      );

      expect(screen.queryByText('Deelnemers')).not.toBeInTheDocument();
    });
  });

  describe('Panel Expansion', () => {
    test('calls onToggleExpand when header is clicked', async () => {
      const user = userEvent.setup();
      const mockToggle = jest.fn();

      render(
        <AutoRecordingPanel 
          {...defaultProps} 
          onToggleExpand={mockToggle}
          isExpanded={false}
        />
      );

      const header = screen.getByText('Automatische Opname').closest('div');
      await user.click(header!);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recording Functionality', () => {
    test('starts recording successfully', async () => {
      const user = userEvent.setup();
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      // Should show initializing state
      expect(screen.getByText('Initialiseren...')).toBeInTheDocument();

      // Wait for recording to start
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });
    });

    test('handles microphone access denied', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Permission denied');
      mockError.name = 'NotAllowedError';
      
      mockGetUserMedia.mockRejectedValueOnce(mockError);

      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Kon opname niet starten/)).toBeInTheDocument();
      });
    });

    test('stops recording successfully', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      render(<AutoRecordingPanel {...defaultProps} />);

      // Start recording
      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });

      // Stop recording
      const stopButton = screen.getByText('Stop Opname');
      await user.click(stopButton);

      await waitFor(() => {
        expect(screen.getByText('Start Opname')).toBeInTheDocument();
      });

      // Verify stream tracks were stopped
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    });
  });

  describe('Timer Functionality', () => {
    test('updates recording time correctly', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      render(<AutoRecordingPanel {...defaultProps} />);

      // Start recording
      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });

      // Advance timer by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('0:05')).toBeInTheDocument();

      // Advance timer by 60 more seconds
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    test('formats time correctly for hours', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      render(<AutoRecordingPanel {...defaultProps} />);

      // Start recording
      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });

      // Advance timer by 1 hour and 5 minutes
      act(() => {
        jest.advanceTimersByTime(3905000); // 1:05:05
      });

      expect(screen.getByText('1:05:05')).toBeInTheDocument();
    });
  });

  describe('Chunk Processing', () => {
    test('sends chunks to N8N webhook', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      render(<AutoRecordingPanel {...defaultProps} />);

      // Start recording
      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });

      // Simulate MediaRecorder data event
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      act(() => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: mockBlob } as any);
        }
      });

      // Advance timer to trigger chunk sending (90 seconds)
      act(() => {
        jest.advanceTimersByTime(90000);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/webhook/transcription'),
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });
    });

    test('handles N8N webhook errors', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      render(<AutoRecordingPanel {...defaultProps} />);

      // Start recording
      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });

      // Simulate chunk creation and sending
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      act(() => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: mockBlob } as any);
        }
      });

      act(() => {
        jest.advanceTimersByTime(90000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Fout bij verzenden audio/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error messages correctly', async () => {
      const user = userEvent.setup();
      mockGetUserMedia.mockRejectedValueOnce(new Error('Test error'));

      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Test error/)).toBeInTheDocument();
      });
    });

    test('clears errors when starting new recording', async () => {
      const user = userEvent.setup();
      const mockStream = createMockMediaStream();
      
      // First attempt fails
      mockGetUserMedia.mockRejectedValueOnce(new Error('Test error'));

      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Test error/)).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockGetUserMedia.mockResolvedValueOnce(mockStream);
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.queryByText(/Test error/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Session Information', () => {
    test('displays session information when recording', async () => {
      const user = userEvent.setup();
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Stop Opname')).toBeInTheDocument();
      });

      expect(screen.getByText(/Sessie ID:/)).toBeInTheDocument();
      expect(screen.getByText('Chunks verzonden:')).toBeInTheDocument();
      expect(screen.getByText('N8N Endpoint:')).toBeInTheDocument();
    });

    test('shows chunk count updates', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockStream = createMockMediaStream();
      
      mockGetUserMedia.mockResolvedValueOnce(mockStream);
      (fetch as jest.Mock).mockResolvedValue({ ok: true });

      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      // Simulate chunk sending
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      act(() => {
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: mockBlob } as any);
        }
      });

      act(() => {
        jest.advanceTimersByTime(90000);
      });

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<AutoRecordingPanel {...defaultProps} />);

      const startButton = screen.getByText('Start Opname');
      expect(startButton).toBeInTheDocument();
      expect(startButton.tagName).toBe('BUTTON');
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const mockToggle = jest.fn();

      render(
        <AutoRecordingPanel 
          {...defaultProps} 
          onToggleExpand={mockToggle}
        />
      );

      const startButton = screen.getByText('Start Opname');
      startButton.focus();
      
      expect(startButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      
      // Should trigger recording start
      expect(screen.getByText('Initialiseren...')).toBeInTheDocument();
    });
  });
});