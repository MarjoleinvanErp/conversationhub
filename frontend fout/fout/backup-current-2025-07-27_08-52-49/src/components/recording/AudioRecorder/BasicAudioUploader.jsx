import React, { useState, useRef } from 'react';

const BasicAudioUploader = ({ 
  onTranscriptionReceived, 
  meetingId = null, 
  disabled = false 
}) => {
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

  const startPureAudioRecording = async () => {
    try {
      console.log('🎤 Starting pure audio recording...');
      setError('');
      setIsRecording(true);
      setRecordingTime(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      // Try WAV first for Azure compatibility, fallback to WebM
      let mimeType = 'audio/wav';
      let fileExtension = 'wav';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log('⚠️ WAV not supported, trying WebM...');
        mimeType = 'audio/webm;codecs=opus';
        fileExtension = 'webm';
        
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.log('⚠️ WebM not supported, using default...');
          mimeType = '';
          fileExtension = 'webm';
        }
      }

      console.log('✅ Selected audio format:', mimeType || 'default');

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      audioStreamRef.current = stream;
      chunksRef.current = [];
      
      console.log('🎤 Recording pure audio with:', mediaRecorder.mimeType);

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📦 Audio chunk:', event.data.size, 'bytes, type:', event.data.type);
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
        
        console.log('✅ Pure audio blob created:');
        console.log('  - Size:', audioBlob.size, 'bytes');
        console.log('  - Type:', audioBlob.type);
        console.log('  - Extension:', fileExtension);
        
        setAudioBlob(audioBlob);
      };

      // Start recording with small chunks for better compatibility
      mediaRecorder.start(1000); // 1 second chunks

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('❌ Recording error:', error);
      setError('Kon opname niet starten: ' + error.message);
      setIsRecording(false);
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

      // Clean MIME type for better compatibility
      const originalType = audioBlob.type;
      const cleanMimeType = originalType.split(';')[0];
      const extension = cleanMimeType.includes('wav') ? 'wav' : 'webm';
      
      console.log('📤 Upload preparation:');
      console.log('  - Original blob type:', originalType);
      console.log('  - Clean MIME type:', cleanMimeType);
      console.log('  - File extension:', extension);
      console.log('  - Size:', audioBlob.size, 'bytes');

      // Create FormData
      const formData = new FormData();
      const filename = `audio_recording_${Date.now()}.${extension}`;
      
      // Create new blob with clean MIME type
      const cleanBlob = new Blob([audioBlob], { type: cleanMimeType });
      
      formData.append('audio', cleanBlob, filename);
      
      if (meetingId) {
        formData.append('meeting_id', meetingId);
      }

      console.log('📤 Uploading pure audio file:', filename);
      console.log('📤 Final file type:', cleanBlob.type);

      // Upload to transcription API
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
          confidence: result.data.confidence || 0.8,
          timestamp: new Date(),
          speaker: 'Audio Upload',
          speakerId: 'audio_upload',
          speakerColor: '#10B981',
          source: 'upload',
          isFinal: true,
          filename: filename,
        };

        setLastTranscription(transcriptionData);

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
    setLastTranscription(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Recording Status */}
      <div className="text-center">
        <div className="flex justify-center items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : audioBlob ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isRecording ? 'Opname bezig...' : 
             audioBlob ? 'Opname gereed voor transcriptie' : 
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
              onClick={startPureAudioRecording}
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
                onClick={uploadAndTranscribe}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-medium"
              >
                📝 Transcribeer & Bewaar
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
              ⏳ Transcriberen en opslaan...
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

      {/* Last Transcription Result */}
      {lastTranscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800 mb-1">✅ Laatste transcriptie opgeslagen:</p>
          <p className="text-sm text-green-700">"{lastTranscription.text}"</p>
        </div>
      )}
    </div>
  );
};

export default BasicAudioUploader;