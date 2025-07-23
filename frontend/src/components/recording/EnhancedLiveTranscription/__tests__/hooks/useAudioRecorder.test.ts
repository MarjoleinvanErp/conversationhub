import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import enhancedLiveTranscriptionService from '@/services/api/enhancedLiveTranscriptionService';

// Mock the service
jest.mock('@/services/api/enhancedLiveTranscriptionService');
const mockService = enhancedLiveTranscriptionService as jest.Mocked<typeof enhancedLiveTranscriptionService>;

describe('useAudioRecorder Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn(),
        chunkDuration: 90
      })
    );

    expect(result.current.recordingState).toEqual({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      recordingStartTime: null,
      error: null,
      speechSupported: false
    });
  });

  it('should start recording successfully', async () => {
    mockService.startEnhancedRecording.mockResolvedValue({
      success: true,
      sessionId: 'test-session'
    });

    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn()
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recordingState.isRecording).toBe(true);
    expect(result.current.recordingState.isPaused).toBe(false);
    expect(mockService.startEnhancedRecording).toHaveBeenCalledWith({
      sessionId: 'test-session',
      useN8N: true
    });
  });

  it('should handle recording timer correctly', async () => {
    mockService.startEnhancedRecording.mockResolvedValue({
      success: true,
      sessionId: 'test-session'
    });

    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn()
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    // Fast forward time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.recordingState.recordingTime).toBe(5);
  });

  it('should handle stop recording', async () => {
    mockService.startEnhancedRecording.mockResolvedValue({
      success: true,
      sessionId: 'test-session'
    });
    mockService.stopRecording.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn()
      })
    );

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recordingState.isRecording).toBe(true);

    // Stop recording
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.recordingState.isRecording).toBe(false);
    expect(mockService.stopRecording).toHaveBeenCalled();
  });

  it('should handle pause and resume recording', async () => {
    mockService.startEnhancedRecording.mockResolvedValue({
      success: true,
      sessionId: 'test-session'
    });
    mockService.pauseRecording.mockResolvedValue({
      success: true
    });
    mockService.resumeRecording.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn()
      })
    );

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Pause recording
    await act(async () => {
      await result.current.pauseRecording();
    });

    expect(result.current.recordingState.isPaused).toBe(true);
    expect(mockService.pauseRecording).toHaveBeenCalled();

    // Resume recording
    await act(async () => {
      await result.current.resumeRecording();
    });

    expect(result.current.recordingState.isPaused).toBe(false);
    expect(mockService.resumeRecording).toHaveBeenCalled();
  });

  it('should handle errors during recording start', async () => {
    mockService.startEnhancedRecording.mockResolvedValue({
      success: false,
      error: 'Microphone access denied'
    });

    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn()
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recordingState.isRecording).toBe(false);
    expect(result.current.recordingState.error).toBe('Failed to start recording');
  });

  it('should require session ID to start recording', async () => {
    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: null, // No session ID
        onAudioChunk: jest.fn()
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.recordingState.isRecording).toBe(false);
    expect(result.current.recordingState.error).toBe('No active session. Please start a session first.');
  });

  it('should call onAudioChunk when processing chunks', async () => {
    const onAudioChunk = jest.fn();
    
    mockService.startEnhancedRecording.mockResolvedValue({
      success: true,
      sessionId: 'test-session'
    });
    
    const mockAudioBlob = new Blob(['audio'], { type: 'audio/webm' });
    mockService.getCurrentAudioChunk.mockResolvedValue(mockAudioBlob);

    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk,
        chunkDuration: 1 // 1 second for faster testing
      })
    );

    await act(async () => {
      await result.current.startRecording();
    });

    // Fast forward time to trigger chunk processing
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onAudioChunk).toHaveBeenCalledWith(mockAudioBlob);
  });

  it('should clear error state', () => {
    const { result } = renderHook(() => 
      useAudioRecorder({
        sessionId: 'test-session',
        onAudioChunk: jest.fn()
      })
    );

    // Manually set error state (this would normally happen through failed operations)
    act(() => {
      result.current.clearError();
    });

    expect(result.current.recordingState.error).toBeNull();
  });
});