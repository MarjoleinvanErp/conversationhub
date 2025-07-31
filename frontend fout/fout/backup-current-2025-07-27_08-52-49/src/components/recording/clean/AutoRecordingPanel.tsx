import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause, Clock, Users } from 'lucide-react';

// Types
interface AudioChunk {
  id: string;
  blob: Blob;
  timestamp: Date;
  duration: number;
}

interface RecordingSession {
  id: string;
  meetingId: string;
  startTime: Date;
  endTime?: Date;
  chunks: AudioChunk[];
  status: 'idle' | 'recording' | 'paused' | 'stopped';
}

interface AutoRecordingPanelProps {
  meetingId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  participants: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
  }>;
}

// Configuratie
const CHUNK_DURATION = 90; // 90 seconden chunks naar N8N
const N8N_WEBHOOK_URL = process.env.NODE_ENV === 'production' 
  ? 'http://n8n:5678/webhook/transcription'
  : 'http://localhost:5678/webhook/transcription';

const AutoRecordingPanel: React.FC<AutoRecordingPanelProps> = ({
  meetingId,
  isExpanded,
  onToggleExpand,
  participants
}) => {
  // State
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChunkSent, setLastChunkSent] = useState<Date | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const currentChunkRef = useRef<Blob[]>([]);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Format tijd
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Helper: Verzend audio chunk naar N8N (Simplified - send WebM directly)
  const sendChunkToN8N = useCallback(async (chunk: Blob, chunkNumber: number) => {
    try {
      console.log(`📤 Sending chunk ${chunkNumber} to N8N...`, {
        size: chunk.size,
        type: chunk.type,
        timestamp: new Date().toISOString()
      });

      // Convert to base64 for reliable transport
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data URL prefix
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read audio blob'));
        reader.readAsDataURL(chunk);
      });

      // Send as JSON with base64 audio data (WebM format - let N8N/Whisper handle conversion)
      const payload = {
        meetingId: meetingId,
        chunkNumber: chunkNumber,
        timestamp: new Date().toISOString(),
        duration: CHUNK_DURATION,
        audioData: base64Data,
        audioType: chunk.type, // Keep original WebM format
        audioSize: chunk.size,
        filename: `chunk_${chunkNumber}_${Date.now()}.webm`
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`N8N webhook error: ${response.status} ${response.statusText}`);
      }

      const result = await response.text();
      console.log(`✅ Audio chunk ${chunkNumber} successfully sent to N8N:`, result);
      
      setLastChunkSent(new Date());
      
    } catch (error) {
      console.error('❌ Error sending chunk to N8N:', error);
      setError(`Error sending audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [meetingId]);

  // Helper: Maak nieuwe chunk en verzend huidige
  const processCurrentChunk = useCallback(async () => {
    if (currentChunkRef.current.length === 0) {
      console.log('⚠️ Geen audio data voor chunk, skippen...');
      return;
    }

    try {
      // Maak blob van chunk data
      const chunkBlob = new Blob(currentChunkRef.current, { type: 'audio/webm' });
      console.log(`🎵 Processing chunk:`, {
        size: chunkBlob.size,
        blobCount: currentChunkRef.current.length,
        duration: CHUNK_DURATION
      });
      
      if (chunkBlob.size > 0) {
        const chunkNumber = session?.chunks.length || 0;
        
        // Verzend naar N8N (wordt geconverteerd naar WAV in sendChunkToN8N)
        await sendChunkToN8N(chunkBlob, chunkNumber + 1);

        // Update session met nieuwe chunk
        if (session) {
          const newChunk: AudioChunk = {
            id: `chunk_${Date.now()}`,
            blob: chunkBlob,
            timestamp: new Date(),
            duration: CHUNK_DURATION
          };

          setSession(prev => prev ? {
            ...prev,
            chunks: [...prev.chunks, newChunk]
          } : null);
        }
      }

      // Reset voor volgende chunk
      currentChunkRef.current = [];

    } catch (error) {
      console.error('❌ Fout bij chunk verwerking:', error);
      setError(`Fout bij chunk verwerking: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, [session, sendChunkToN8N]);

  // Setup MediaRecorder
  const setupMediaRecorder = useCallback((stream: MediaStream) => {
    console.log('🔧 setupMediaRecorder called with stream:', stream);
    
    console.log('🎥 Creating MediaRecorder...');
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    console.log('✅ MediaRecorder created:', recorder);

    // Event handlers
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log(`📊 Data available: ${event.data.size} bytes`);
        currentChunkRef.current.push(event.data);
      }
    };

    recorder.onstart = () => {
      console.log('🎙️ MediaRecorder gestart');
      currentChunkRef.current = [];
    };

    recorder.onstop = () => {
      console.log('⏹️ MediaRecorder gestopt');
    };

    recorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event);
      setError('Fout bij audio opname');
    };

    mediaRecorderRef.current = recorder;
    return recorder;
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    console.log('🚀 startRecording called');
    setIsInitializing(true);
    setError(null);

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      console.log('✅ Microphone access granted, stream:', stream);

      audioStreamRef.current = stream;
      
      console.log('🔧 Setting up MediaRecorder...');
      const recorder = setupMediaRecorder(stream);
      console.log('✅ MediaRecorder setup complete:', recorder);

      // Create session
      const newSession: RecordingSession = {
        id: `session_${Date.now()}`,
        meetingId,
        startTime: new Date(),
        chunks: [],
        status: 'recording'
      };
      setSession(newSession);

      // Start recording
      recorder.start(1000); // Collect data every 1 second for smooth chunks
      console.log('🎙️ Recording gestart met 1s intervals');

      // Start chunk interval (elke 90 seconden)
      console.log('⏰ Setting up 90s chunk interval...');
      chunkIntervalRef.current = setInterval(() => {
        console.log('⏰ 90s interval triggered - processing chunk');
        processCurrentChunk();
      }, CHUNK_DURATION * 1000);

      // Start recording time counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎙️ Automatische opname gestart');

    } catch (error) {
      console.error('❌ Fout bij starten opname:', error);
      setError(`Kon opname niet starten: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setIsInitializing(false);
    }
  }, [meetingId, setupMediaRecorder, processCurrentChunk]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    console.log('🛑 stopRecording called');

    try {
      // Stop intervals first
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
        console.log('⏰ Chunk interval gestopt');
      }

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
        console.log('⏰ Recording interval gestopt');
      }

      // Stop MediaRecorder and wait for final data
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        console.log('⏹️ MediaRecorder gestopt');

        // Wait a moment for final ondataavailable event
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Process final chunk if any data exists
      if (currentChunkRef.current.length > 0) {
        console.log('🎵 Processing final chunk on stop...', {
          blobCount: currentChunkRef.current.length,
          totalSize: currentChunkRef.current.reduce((total, blob) => total + blob.size, 0)
        });
        await processCurrentChunk();
      } else {
        console.log('⚠️ No final chunk data to process');
      }

      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        console.log('📴 Audio stream gestopt');
      }

      // Update session
      setSession(prev => prev ? {
        ...prev,
        status: 'stopped',
        endTime: new Date()
      } : null);

      console.log('✅ Opname volledig gestopt');

    } catch (error) {
      console.error('❌ Fout bij stoppen opname:', error);
      setError(`Fout bij stoppen opname: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, [processCurrentChunk]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Render
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            session?.status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
          }`} />
          <h3 className="text-lg font-semibold text-gray-900">Automatische Opname</h3>
          {session?.status === 'recording' && (
            <span className="text-sm text-gray-500">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {session?.chunks.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {session.chunks.length} chunks
            </span>
          )}
          {lastChunkSent && (
            <span className="text-xs text-green-600">
              Laatste verzending: {lastChunkSent.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Sluiten
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-4 mb-4">
            {session?.status !== 'recording' ? (
              <button
                onClick={startRecording}
                disabled={isInitializing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic className="w-4 h-4" />
                <span>{isInitializing ? 'Initialiseren...' : 'Start Opname'}</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Square className="w-4 h-4" />
                <span>Stop Opname</span>
              </button>
            )}

            {session?.status === 'recording' && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Opname loopt: {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Session Info */}
          {session && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    session.status === 'recording' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status === 'recording' ? 'Opname actief' : 'Gestopt'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Chunks verzonden:</span>
                  <span className="ml-2">{session.chunks.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Gestart:</span>
                  <span className="ml-2">{session.startTime.toLocaleTimeString()}</span>
                </div>
                {session.endTime && (
                  <div>
                    <span className="font-medium text-gray-700">Gestopt:</span>
                    <span className="ml-2">{session.endTime.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Deelnemers ({participants.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <span
                  key={participant.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    participant.status === 'online' ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  {participant.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoRecordingPanel;