import React, { useState, useRef } from 'react';

const BasicAudioUploader = ({ onTranscriptionReceived, meetingId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [recordingFormat, setRecordingFormat] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

const startRecording = async () => {
  try {
    setError('');
    setTranscriptionResult(null);
    
    // Get microphone access - AUDIO ONLY
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        channelCount: 1, // Mono audio
        volume: 1.0
      },
      video: false // Expliciet GEEN video
    });
    
    audioStreamRef.current = stream;

    // Probeer audio-only formats in volgorde van voorkeur
    let mimeType = null;
    let fileExtension = 'wav';
    
    // Prioriteit: WAV > MP3 > OGG > WebM (vermijd video formaten)
    const audioFormats = [
      { mime: 'audio/wav', ext: 'wav' },
      { mime: 'audio/wav; codecs=pcm', ext: 'wav' },
      { mime: 'audio/mpeg', ext: 'mp3' },
      { mime: 'audio/mp3', ext: 'mp3' },
      { mime: 'audio/ogg; codecs=opus', ext: 'ogg' },
      { mime: 'audio/ogg', ext: 'ogg' },
      { mime: 'audio/webm; codecs=opus', ext: 'webm' },
      { mime: 'audio/webm', ext: 'webm' },
    ];
    
    // Test alleen audio formats
    for (const format of audioFormats) {
      if (MediaRecorder.isTypeSupported(format.mime)) {
        mimeType = format.mime;
        fileExtension = format.ext;
        console.log('✅ Selected audio format:', format.mime);
        break;
      }
    }
    
    if (!mimeType) {
      throw new Error('Geen ondersteund audio formaat gevonden');
    }
    
    setRecordingFormat(mimeType);
    console.log('🎤 Recording pure audio with:', mimeType);
    
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
        console.log('📦 Audio chunk:', event.data.size, 'bytes, type:', event.data.type);
      }
    };

    // Handle stop
    mediaRecorder.onstop = () => {
      // Forceer het correcte audio MIME type
      const audioBlob = new Blob(chunksRef.current, { 
        type: mimeType // Gebruik exact hetzelfde type als recording
      });
      setAudioBlob(audioBlob);
      console.log('✅ Pure audio blob created:');
      console.log('  - Size:', audioBlob.size, 'bytes');
      console.log('  - Type:', audioBlob.type);
      console.log('  - Extension:', fileExtension);
    };

    // Start recording met data collection interval
    mediaRecorder.start(1000); // Collect elke seconde
    setIsRecording(true);
    setRecordingTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

  } catch (error) {
    console.error('❌ Recording error:', error);
    setError('Kon opname niet starten: ' + error.message);
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

  setIsUploading(true);
  setError('');

  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Niet ingelogd');
    }

    // Bepaal clean audio MIME type en extensie
    let cleanMimeType = 'audio/wav';
    let fileExtension = 'wav';
    
    const originalType = audioBlob.type;
    
    if (originalType.includes('wav')) {
      cleanMimeType = 'audio/wav';
      fileExtension = 'wav';
    } else if (originalType.includes('mp3') || originalType.includes('mpeg')) {
      cleanMimeType = 'audio/mpeg';
      fileExtension = 'mp3';
    } else if (originalType.includes('ogg')) {
      cleanMimeType = 'audio/ogg';
      fileExtension = 'ogg';
    } else if (originalType.includes('webm')) {
      cleanMimeType = 'audio/webm';
      fileExtension = 'webm';
    }

    console.log('📤 Upload preparation:');
    console.log('  - Original blob type:', originalType);
    console.log('  - Clean MIME type:', cleanMimeType);
    console.log('  - File extension:', fileExtension);
    console.log('  - Size:', audioBlob.size, 'bytes');

    // Create FormData met clean audio file
    const formData = new FormData();
    const filename = `audio_recording_${Date.now()}.${fileExtension}`;
    
    // Create proper audio File object
    const audioFile = new File([audioBlob], filename, { 
      type: cleanMimeType,
      lastModified: Date.now()
    });
    
    formData.append('audio', audioFile);
    
    if (meetingId) {
      formData.append('meeting_id', meetingId);
    }

    console.log('📤 Uploading pure audio file:', filename);
    console.log('📤 Final file type:', audioFile.type);

    // Upload to backend
    const response = await fetch('http://localhost:8000/api/speech/transcribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    console.log('📨 Response status:', response.status);
    
    const result = await response.json();
    console.log('📝 Transcription result:', result);

    if (result.success) {
      const transcriptionData = {
        text: result.data.text,
        language: result.data.language,
        duration: result.data.duration,
        confidence: result.data.confidence,
        timestamp: new Date(),
        speaker: 'Audio Upload',
        source: 'whisper',
        format: fileExtension,
        originalMimeType: originalType,
        cleanMimeType: cleanMimeType
      };

      setTranscriptionResult(transcriptionData);

      // Call parent callback
      if (onTranscriptionReceived) {
        onTranscriptionReceived(transcriptionData);
      }
      
      // Reset for next recording
      setAudioBlob(null);
      setRecordingTime(0);
    } else {
      throw new Error(result.message || 'Transcriptie mislukt');
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    setError(`Upload fout: ${error.message}`);
  } finally {
    setIsUploading(false);
  }
};

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError('');
    setTranscriptionResult(null);
    setRecordingFormat('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">🎤 Stap 1: Audio Upload & Transcriptie</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Recording Status */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center space-x-2 mb-2">
          <div className={`w-4 h-4 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 
            audioBlob ? 'bg-blue-500' : 'bg-gray-300'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isRecording ? 'Opname actief...' : 
             audioBlob ? 'Opname gereed voor transcriptie' : 
             'Klaar voor opname'}
          </span>
        </div>
        
        <div className="text-3xl font-mono text-gray-900 mb-2">
          {formatTime(recordingTime)}
        </div>

        {/* Format Info */}
        {recordingFormat && (
          <div className="text-xs text-gray-500 mb-4">
            📊 Format: {recordingFormat}
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {!isRecording && !audioBlob && !isUploading && (
            <button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg font-medium"
            >
              🎤 Start Opname
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full text-lg font-medium"
            >
              ⏹️ Stop Opname
            </button>
          )}

          {audioBlob && !isUploading && (
            <div className="space-x-3">
              <button
                onClick={uploadAndTranscribe}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium"
              >
                📤 Upload & Transcribeer
              </button>
              <button
                onClick={resetRecording}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-full"
              >
                🔄 Opnieuw
              </button>
            </div>
          )}

          {isUploading && (
            <button
              disabled
              className="bg-blue-400 text-white px-8 py-3 rounded-full text-lg font-medium opacity-75"
            >
              ⏳ Uploaden & Transcriberen...
            </button>
          )}
        </div>
      </div>

      {/* Audio Preview */}
      {audioBlob && (
        <div className="border-t pt-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">📻 Audio preview:</p>
          <div className="bg-gray-50 p-3 rounded mb-2">
            <div className="text-xs text-gray-600 mb-2">
              📊 Type: {audioBlob.type} | 📦 Size: {Math.round(audioBlob.size / 1024)}KB
            </div>
            <audio 
              controls 
              src={URL.createObjectURL(audioBlob)} 
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Transcription Result */}
      {transcriptionResult && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📝 Transcriptie resultaat:</p>
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <p className="text-gray-900 mb-2 font-medium">{transcriptionResult.text}</p>
            <div className="text-xs text-gray-500 flex flex-wrap gap-4">
              <span>🌍 {transcriptionResult.language}</span>
              <span>⏱️ {transcriptionResult.duration}s</span>
              <span>📊 {Math.round(transcriptionResult.confidence * 100)}%</span>
              <span>📁 {transcriptionResult.format}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicAudioUploader;