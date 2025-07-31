import React, { useState, useRef } from 'react';

const AudioUploadRecorder = ({ onTranscriptionReceived, meetingId = null, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [lastTranscription, setLastTranscription] = useState(null);

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

      // Setup MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      
      // Check for better format support
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      console.log('Recording with format:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        console.log('Recording stopped. Blob size:', audioBlob.size, 'bytes');
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

  const uploadAndProcess = async () => {
    if (!audioBlob) {
      setError('Geen audio opgenomen');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Niet ingelogd');
      }

      console.log('Uploading audio blob:', audioBlob.size, 'bytes');

      // Create FormData
      const formData = new FormData();
      const extension = audioBlob.type.includes('wav') ? 'wav' : 
                       audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      formData.append('audio', audioBlob, `recording_${Date.now()}.${extension}`);
      
      if (meetingId) {
        formData.append('meeting_id', meetingId);
      }

      // Upload to backend
      const response = await fetch('http://localhost:8000/api/audio/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.success) {
        // Extract transcription from result
        const transcription = result.data.transcription;
        
        if (transcription.success) {
          const transcriptionData = {
            text: transcription.text,
            language: transcription.language,
            duration: transcription.duration || recordingTime,
            timestamp: new Date(),
            speaker: 'Audio Upload',
            filename: result.data.filename,
          };

          setLastTranscription(transcriptionData);

          // Call parent callback
          if (onTranscriptionReceived) {
            onTranscriptionReceived(transcriptionData);
          }
        } else {
          setError('Transcriptie mislukt: ' + transcription.error);
        }
        
        // Reset for next recording
        setAudioBlob(null);
        setRecordingTime(0);
      } else {
        throw new Error(result.message || 'Upload mislukt');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload fout: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError('');
    setLastTranscription(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Audio Opname → Opslaan → Whisper</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Recording Status */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 
            audioBlob ? 'bg-blue-500' : 'bg-gray-300'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isRecording ? 'Opname actief...' : 
             audioBlob ? 'Opname gereed voor upload' : 
             'Klaar voor opname'}
          </span>
        </div>
        
        <div className="text-2xl font-mono text-gray-900 mb-4">
          {formatTime(recordingTime)}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!isRecording && !audioBlob && !isUploading && (
            <button
              onClick={startRecording}
              disabled={disabled}
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

          {audioBlob && !isUploading && (
            <div className="space-x-3">
              <button
                onClick={uploadAndProcess}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-medium"
              >
                📤 Upload & Transcribeer
              </button>
              <button
                onClick={resetRecording}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-full"
              >
                🔄 Opnieuw
              </button>
            </div>
          )}

          {isUploading && (
            <button
              disabled
              className="bg-blue-400 text-white px-6 py-3 rounded-full text-lg font-medium opacity-75"
            >
              ⏳ Uploaden & Verwerken...
            </button>
          )}
        </div>
      </div>

      {/* Audio Preview */}
      {audioBlob && (
        <div className="border-t pt-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Opname preview:</p>
          <audio 
            controls 
            src={URL.createObjectURL(audioBlob)} 
            className="w-full"
          />
        </div>
      )}

      {/* Last Transcription */}
      {lastTranscription && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Laatste transcriptie:</p>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-900">{lastTranscription.text}</p>
            <p className="text-xs text-gray-500 mt-1">
              Bestand: {lastTranscription.filename} • 
              Taal: {lastTranscription.language} • 
              Duur: {lastTranscription.duration}s
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioUploadRecorder;