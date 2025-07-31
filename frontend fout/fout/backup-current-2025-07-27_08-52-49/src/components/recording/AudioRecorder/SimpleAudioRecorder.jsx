import React, { useState, useRef } from 'react';

const SimpleAudioRecorder = ({ onTranscriptionReceived, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [mimeType, setMimeType] = useState('audio/webm');

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError('');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      audioStreamRef.current = stream;

      // Setup MediaRecorder with better format support
      let selectedMimeType = 'audio/webm;codecs=opus';
      
      // Check supported formats and pick the best one
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        selectedMimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        selectedMimeType = 'audio/mp4';
      }
      
      setMimeType(selectedMimeType);
      console.log('Using audio format:', selectedMimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000, // Higher quality
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: selectedMimeType 
        });
        setAudioBlob(audioBlob);
        console.log('Audio blob created:', audioBlob.size, 'bytes, type:', selectedMimeType);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Kon opname niet starten. Controleer microfoon toegang.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
  };

  const uploadAndTranscribe = async () => {
    if (!audioBlob) {
      setError('Geen audio opgenomen');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      console.log('Starting transcription upload...');
      console.log('Token present:', !!token);
      console.log('Audio blob size:', audioBlob.size);
      
      if (!token) {
        throw new Error('Niet ingelogd');
      }

      // Create FormData with better filename
      const formData = new FormData();
      const extension = mimeType.includes('wav') ? 'wav' : 
                       mimeType.includes('mp4') ? 'm4a' : 'webm';
      formData.append('audio', audioBlob, `recording.${extension}`);
      
      console.log('Uploading audio:', audioBlob.size, 'bytes as', extension);
      console.log('Using token:', token.substring(0, 10) + '...');

      // Upload to transcription API
      const response = await fetch('http://localhost:8000/api/speech/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        // Call parent callback with transcription
        if (onTranscriptionReceived) {
          onTranscriptionReceived({
            text: result.data.text,
            language: result.data.language,
            duration: result.data.duration,
            timestamp: new Date(),
            speaker: 'Opname',
          });
        }
        
        // Reset for next recording
        setAudioBlob(null);
        setRecordingTime(0);
      } else {
        throw new Error(result.message || 'Transcriptie mislukt');
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setError(`Fout bij transcriptie: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Audio Opname & Transcriptie</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Recording Status */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isRecording ? 'Opname bezig...' : audioBlob ? 'Opname klaar' : 'Klaar voor opname'}
          </span>
        </div>
        
        <div className="text-2xl font-mono text-gray-900 mb-4">
          {formatTime(recordingTime)}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-full text-lg font-medium"
            >
              🎤 Start Opname
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full text-lg font-medium"
            >
              ⏹️ Stop Opname
            </button>
          )}

          {audioBlob && !isProcessing && (
            <div className="space-x-3">
              <button
                onClick={uploadAndTranscribe}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-medium"
              >
                📝 Transcribeer
              </button>
              <button
                onClick={resetRecording}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-full"
              >
                🔄 Opnieuw
              </button>
            </div>
          )}

          {isProcessing && (
            <button
              disabled
              className="bg-blue-400 text-white px-6 py-3 rounded-full text-lg font-medium opacity-75"
            >
              ⏳ Transcriberen...
            </button>
          )}
        </div>
      </div>

      {/* Audio Preview */}
      {audioBlob && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Opname preview:</p>
          <audio 
            controls 
            src={URL.createObjectURL(audioBlob)} 
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

export default SimpleAudioRecorder;