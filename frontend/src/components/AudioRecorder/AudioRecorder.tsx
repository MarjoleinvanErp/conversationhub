import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { Mic, MicOff, Stop } from '@mui/icons-material';
import type { AudioRecorderProps, AudioChunk, RecordingState } from '@/types';

/**
 * AudioRecorder Component voor ConversationHub
 * 
 * Handelt audio opname af met browser MediaRecorder API
 * Stuurt audio chunks naar parent component voor transcriptie
 * 
 * @param props AudioRecorderProps
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioChunk,
  onError,
  isRecording,
  onToggleRecording
}) => {
  // State management met TypeScript
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  
  // Refs voor MediaRecorder en stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start audio recording
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingState('processing');

      // Vraag microfoon permissie
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Handle audio data chunks
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          const audioChunk: AudioChunk = {
            id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            blob: event.data,
            timestamp: Date.now(),
            duration: duration,
            size: event.data.size,
            format: 'webm'
          };
          
          onAudioChunk(audioChunk);
        }
      };

      // Handle recording errors
      mediaRecorder.onerror = (event: Event) => {
        const error = new Error(`MediaRecorder error: ${event}`);
        setError(error.message);
        onError(error);
        setRecordingState('idle');
      };

      // Start recording met 1 seconde chunks
      mediaRecorder.start(1000);
      setRecordingState('recording');

      // Start duration timer
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      const error = err as Error;
      setError(`Kan microfoon niet openen: ${error.message}`);
      onError(error);
      setRecordingState('idle');
    }
  }, [onAudioChunk, onError, duration]);

  /**
   * Stop audio recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setRecordingState('idle');
    setDuration(0);
  }, []);

  /**
   * Toggle recording state
   */
  const handleToggleRecording = useCallback(() => {
    if (recordingState === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
    onToggleRecording();
  }, [recordingState, startRecording, stopRecording, onToggleRecording]);

  /**
   * Format duration als MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Cleanup bij unmount
   */
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <Box className="audio-recorder p-4 bg-white rounded-lg shadow-md">
      {/* Error Display */}
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Recording Status */}
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h6" className="text-gray-800">
          Audio Opname
        </Typography>
        
        {recordingState === 'recording' && (
          <Box className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <Typography variant="body2" className="text-red-600 font-medium">
              {formatDuration(duration)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Recording Controls */}
      <Box className="flex items-center justify-center space-x-4">
        <Button
          variant={recordingState === 'recording' ? 'contained' : 'outlined'}
          color={recordingState === 'recording' ? 'error' : 'primary'}
          size="large"
          onClick={handleToggleRecording}
          disabled={recordingState === 'processing'}
          startIcon={recordingState === 'recording' ? <MicOff /> : <Mic />}
          className="min-w-[140px]"
        >
          {recordingState === 'processing' && 'Bezig...'}
          {recordingState === 'recording' && 'Stop Opname'}
          {recordingState === 'idle' && 'Start Opname'}
        </Button>

        {recordingState === 'recording' && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={stopRecording}
            startIcon={<Stop />}
          >
            Volledig Stoppen
          </Button>
        )}
      </Box>

      {/* Recording Info */}
      <Box className="mt-4 p-3 bg-gray-50 rounded">
        <Typography variant="body2" className="text-gray-600 text-center">
          {recordingState === 'idle' && 'Druk op "Start Opname" om te beginnen'}
          {recordingState === 'processing' && 'Microfoon wordt voorbereid...'}
          {recordingState === 'recording' && 'Opname actief - spreek duidelijk in de microfoon'}
        </Typography>
      </Box>
    </Box>
  );
};

export default AudioRecorder;