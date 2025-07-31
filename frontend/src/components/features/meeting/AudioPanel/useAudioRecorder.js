import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const useAudioRecorder = () => {
  const { id: meetingId } = useParams(); // Meeting ID uit URL
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [chunksProcessed, setChunksProcessed] = useState(0);
  const [n8nConnected, setN8nConnected] = useState(true);
  const [lastChunkSent, setLastChunkSent] = useState(null);
  const [audioQuality, setAudioQuality] = useState('medium');
  const [chunkInterval, setChunkInterval] = useState(10);
  const [error, setError] = useState(null);
  const [processingChunk, setProcessingChunk] = useState(false);
  const [processingFinalAudio, setProcessingFinalAudio] = useState(false);

  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const chunkTimerRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // N8N Webhook URLs
  const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/transcription';
  // Fallback URL voor als localhost niet werkt
  const N8N_WEBHOOK_URL_FALLBACK = 'http://n8n:5678/webhook-test/transcription';

  const getAudioConfig = () => {
    const configs = {
      low: { sampleRate: 16000, bitRate: 64000 },
      medium: { sampleRate: 44100, bitRate: 128000 },
      high: { sampleRate: 48000, bitRate: 256000 }
    };
    return configs[audioQuality];
  };

  const startRecording = async () => {
    try {
      setError(null);
      console.log('🎙️ Starting audio recording for meeting:', meetingId);

      // Get user media with high quality audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: getAudioConfig().sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      audioStreamRef.current = stream;

      // Setup audio visualization
      setupAudioVisualization(stream);

      // Setup MediaRecorder voor WAV format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'  // Browser compatible, we'll convert to WAV
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      // Handle audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('📦 Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped');
        await processFinalAudio();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second for chunks
      
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setChunksProcessed(0);
      startTimer();
      startChunkProcessing();

      console.log('✅ Recording started successfully');

    } catch (err) {
      console.error('❌ Failed to start recording:', err);
      setError('Kon opname niet starten: ' + err.message);
      setIsRecording(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      console.log('⏸️ Recording paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
      console.log('▶️ Recording resumed');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording...');
      setProcessingFinalAudio(true);
      
      stopTimer();
      clearChunkTimer();
      
      // Stop recording
      mediaRecorderRef.current.stop();
      
      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🔇 Audio track stopped');
        });
      }

      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const processFinalAudio = async () => {
    try {
      if (recordedChunksRef.current.length === 0) {
        throw new Error('Geen audio data beschikbaar');
      }

      console.log('🔄 Processing final audio...', recordedChunksRef.current.length, 'chunks');

      // Create audio blob from all chunks
      const audioBlob = new Blob(recordedChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });

      console.log('📦 Created audio blob:', audioBlob.size, 'bytes');

      // Convert to WAV and send to N8N
      const wavBlob = await convertToWav(audioBlob);
      await sendAudioToN8N(wavBlob, 'final');

      // Clear recorded chunks
      recordedChunksRef.current = [];

      console.log('✅ Final audio processed successfully');

    } catch (err) {
      console.error('❌ Failed to process final audio:', err);
      setError('Fout bij verwerken finale audio: ' + err.message);
    } finally {
      setProcessingFinalAudio(false);
    }
  };

  const convertToWav = async (webmBlob) => {
    try {
      console.log('🔄 Converting WebM to WAV...');

      // Create audio context for conversion
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: getAudioConfig().sampleRate
      });

      // Convert blob to array buffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert to WAV format
      const wavArrayBuffer = audioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

      console.log('✅ Converted to WAV:', wavBlob.size, 'bytes');
      return wavBlob;

    } catch (err) {
      console.error('❌ WAV conversion failed:', err);
      // Fallback: return original blob
      return webmBlob;
    }
  };

  const audioBufferToWav = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = audioBuffer.getChannelData(0);
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * bytesPerSample);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length * bytesPerSample, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  const sendAudioToN8N = async (audioBlob, type = 'chunk') => {
    try {
      setProcessingChunk(true);
      console.log(`📤 Sending ${type} audio to N8N...`, audioBlob.size, 'bytes');

      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, `meeting_${meetingId}_${type}_${Date.now()}.wav`);
      formData.append('meeting_id', meetingId);
      formData.append('type', type);
      formData.append('timestamp', new Date().toISOString());

      // Try primary URL first
      let response;
      try {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          body: formData,
        });
      } catch (primaryError) {
        console.log('🔄 Primary N8N URL failed, trying fallback...');
        response = await fetch(N8N_WEBHOOK_URL_FALLBACK, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error(`N8N responded with status: ${response.status}`);
      }

      const result = await response.text();
      console.log('✅ N8N response:', result);

      // Update UI
      setChunksProcessed(prev => prev + 1);
      setLastChunkSent(`${type}: ${new Date().toLocaleTimeString()}`);
      setN8nConnected(true);

      console.log(`✅ ${type} audio sent successfully to N8N`);

    } catch (err) {
      console.error('❌ Failed to send audio to N8N:', err);
      setError(`N8N verzending gefaald: ${err.message}`);
      setN8nConnected(false);
      throw err;
    } finally {
      setProcessingChunk(false);
    }
  };

  const setupAudioVisualization = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording && !isPaused) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume level
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(Math.min(100, average));
        }
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (err) {
      console.error('Failed to setup audio visualization:', err);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startChunkProcessing = () => {
    // Send intermediate chunks to N8N for real-time processing
    chunkTimerRef.current = setInterval(async () => {
      if (recordedChunksRef.current.length > 0 && isRecording && !isPaused) {
        try {
          // Create chunk from recent data
          const recentChunks = recordedChunksRef.current.splice(0, Math.floor(recordedChunksRef.current.length / 2));
          if (recentChunks.length > 0) {
            const chunkBlob = new Blob(recentChunks, { type: 'audio/webm;codecs=opus' });
            const wavChunk = await convertToWav(chunkBlob);
            await sendAudioToN8N(wavChunk, 'chunk');
          }
        } catch (err) {
          console.error('Failed to process chunk:', err);
        }
      }
    }, chunkInterval * 1000);
  };

  const clearChunkTimer = () => {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      clearChunkTimer();
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    chunksProcessed,
    n8nConnected,
    lastChunkSent,
    audioQuality,
    chunkInterval,
    error,
    processingChunk,
    processingFinalAudio,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setAudioQuality,
    setChunkInterval,
    setError
  };
};