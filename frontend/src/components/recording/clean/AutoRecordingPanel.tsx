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

  // Helper: Verzend audio chunk naar N8N
  const sendChunkToN8N = useCallback(async (chunk: Blob, chunkNumber: number) => {
    try {
      const formData = new FormData();
      formData.append('audio', chunk, `chunk_${chunkNumber}_${Date.now()}.webm`);
      formData.append('meetingId', meetingId);
      formData.append('chunkNumber', chunkNumber.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('duration', CHUNK_DURATION.toString());

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`N8N webhook error: ${response.status}`);
      }

      setLastChunkSent(new Date());
      console.log(`✅ Audio chunk ${chunkNumber} verzonden naar N8N`);
      
    } catch (error) {
      console.error('❌ Fout bij verzenden chunk naar N8N:', error);
      setError(`Fout bij verzenden audio: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, [meetingId]);

  // Helper: Start nieuwe audio chunk opname
  const startNewChunk = useCallback(() => {
    if (!mediaRecorderRef.current || session?.status !== 'recording') return;

    currentChunkRef.current = [];
    
    if (mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start();
    }
  }, [session?.status]);

  // Helper: Stop en verzend huidige chunk
  const stopAndSendChunk = useCallback(async () => {
    if (!mediaRecorderRef.current || currentChunkRef.current.length === 0) return;

    try {
      // Stop opname als actief
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Wacht tot data beschikbaar is
      await new Promise<void>((resolve) => {
        const checkData = () => {
          if (currentChunkRef.current.length > 0) {
            resolve();
          } else {
            setTimeout(checkData, 100);
          }
        };
        checkData();
      });

      // Maak blob van chunk data
      const chunkBlob = new Blob(currentChunkRef.current, { type: 'audio/webm' });
      
      if (chunkBlob.size > 0) {
        const chunkNumber = session?.chunks.length || 0;
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

    } catch (error) {
      console.error('❌ Fout bij chunk verwerking:', error);
      setError(`Fout bij chunk verwerking: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, [session, sendChunkToN8N]);

  // Setup MediaRecorder
  const setupMediaRecorder = useCallback((stream: MediaStream) => {

console.log('🔧 setupMediaRecorder called with stream:', stream); // DEBUG
    try {
      console.log('🎥 Creating MediaRecorder...');
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      console.log('✅ MediaRecorder created:', mediaRecorder);

      mediaRecorder.ondataavailable = (event) => {
console.log('📊 Data available event:', event.data.size, 'bytes'); // DEBUG
        if (event.data.size > 0) {
          currentChunkRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('📹 MediaRecorder gestart');
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder gestopt');
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder fout:', event);
        setError('MediaRecorder fout opgetreden');
      };

      mediaRecorderRef.current = mediaRecorder;
      return mediaRecorder;

    } catch (error) {
      console.error('❌ Fout bij MediaRecorder setup:', error);
      throw new Error(`MediaRecorder setup mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, []);

  // Start automatische opname
  const startRecording = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    console.log('🚀 startRecording called'); // DEBUG

    try {
      // Vraag microfoon toegang
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      console.log('✅ Microphone access granted, stream:', stream);
      audioStreamRef.current = stream;

      // Setup MediaRecorder
      console.log('🔧 Setting up MediaRecorder...');
      const mediaRecorder = setupMediaRecorder(stream);
      console.log('✅ MediaRecorder setup complete:', mediaRecorder);

      // Maak nieuwe session
      const newSession: RecordingSession = {
        id: `session_${Date.now()}`,
        meetingId,
        startTime: new Date(),
        chunks: [],
        status: 'recording'
      };

      setSession(newSession);

      // Start eerste chunk
      startNewChunk();

      // Setup chunk interval (elke 90 seconden)
      chunkIntervalRef.current = setInterval(async () => {
        await stopAndSendChunk();
        startNewChunk();
      }, CHUNK_DURATION * 1000);

      // Setup timer
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
  }, [meetingId, setupMediaRecorder, startNewChunk, stopAndSendChunk]);

  // Stop opname
  const stopRecording = useCallback(async () => {
    try {
      // Clear intervals
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Stop en verzend laatste chunk
      await stopAndSendChunk();

      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      // Update session
      if (session) {
        setSession(prev => prev ? {
          ...prev,
          status: 'stopped',
          endTime: new Date()
        } : null);
      }

      console.log('⏹️ Opname gestopt');

    } catch (error) {
      console.error('❌ Fout bij stoppen opname:', error);
      setError(`Fout bij stoppen opname: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  }, [session, stopAndSendChunk]);

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Render
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div 
        className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${session?.status === 'recording' ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Mic className={`w-5 h-5 ${session?.status === 'recording' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Automatische Opname</h3>
              <p className="text-sm text-gray-600">
                {session?.status === 'recording' 
                  ? `Actief sinds ${formatTime(recordingTime)}`
                  : 'Real-time transcriptie met N8N'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {session?.status === 'recording' && (
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">REC</span>
              </div>
            )}
            
            <button className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Recording Status */}
          <div className="text-center mb-6">
            <div className="text-4xl font-mono text-slate-800 mb-2">
              {formatTime(recordingTime)}
            </div>
            
            {session?.status === 'recording' && (
              <div className="text-sm text-slate-600 space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Gestart: {session.startTime.toLocaleTimeString('nl-NL')}</span>
                </div>
                {lastChunkSent && (
                  <div className="text-xs text-green-600">
                    Laatste chunk verzonden: {lastChunkSent.toLocaleTimeString('nl-NL')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Controls */}
          <div className="flex justify-center space-x-4 mb-6">
            {!session || session.status === 'stopped' ? (
              <button
                onClick={startRecording}
                disabled={isInitializing}
                className={`bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 ${
                  isInitializing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isInitializing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Initialiseren...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Start Opname</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Square className="w-5 h-5" />
                <span>Stop Opname</span>
              </button>
            )}
          </div>

          {/* Recording Info */}
          {session && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sessie ID:</span>
                <span className="font-mono text-gray-800">{session.id}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Chunks verzonden:</span>
                <span className="font-medium text-gray-800">{session.chunks.length}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">N8N Endpoint:</span>
                <span className="font-mono text-xs text-gray-600">{N8N_WEBHOOK_URL}</span>
              </div>
            </div>
          )}

          {/* Participants Info */}
          {participants.length > 0 && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Deelnemers ({participants.length})
                </span>
              </div>
              
              <div className="space-y-2">
                {participants.slice(0, 3).map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-gray-700">{participant.name}</span>
                    <span className="text-gray-500">({participant.role})</span>
                  </div>
                ))}
                
                {participants.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{participants.length - 3} meer...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Info */}
          <div className="mt-6 text-xs text-gray-500 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Chunk grootte:</span> {CHUNK_DURATION}s
              </div>
              <div>
                <span className="font-medium">Audio format:</span> WebM/Opus
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoRecordingPanel;