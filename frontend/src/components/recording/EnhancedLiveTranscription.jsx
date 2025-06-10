import React, { useState, useEffect, useRef } from 'react';
import enhancedLiveTranscriptionService from '../../services/api/enhancedLiveTranscriptionService';
import TimelineTranscription from './timeline/TimelineTranscription.jsx';

const EnhancedLiveTranscription = ({ 
  meetingId, 
  participants = [], 
  onTranscriptionUpdate = () => {},
  onSessionStatsUpdate = () => {}
}) => {
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);

  // Voice setup state
  const [voiceSetupPhase, setVoiceSetupPhase] = useState(false);
  const [currentSetupSpeaker, setCurrentSetupSpeaker] = useState(0);
  const [voiceSetupComplete, setVoiceSetupComplete] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSetupError, setVoiceSetupError] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);

  // Transcription state
  const [liveTranscriptions, setLiveTranscriptions] = useState([]);
  const [whisperTranscriptions, setWhisperTranscriptions] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // FIXED: Better transcription queue management
  const [waitingForWhisper, setWaitingForWhisper] = useState([]); // Transcriptions waiting for Whisper
  const [audioChunkQueue, setAudioChunkQueue] = useState([]); // Audio chunks waiting to be processed

  // Processing state
  const [isProcessingWhisper, setIsProcessingWhisper] = useState(false);
  const [whisperProgress, setWhisperProgress] = useState('');

  // UI state
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs
  const liveTranscriptEndRef = useRef(null);
  const whisperTranscriptEndRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && liveTranscriptions.length > 0) {
      setTimeout(() => {
        liveTranscriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [liveTranscriptions.length, autoScroll]);

  useEffect(() => {
    if (autoScroll && whisperTranscriptions.length > 0) {
      setTimeout(() => {
        whisperTranscriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [whisperTranscriptions.length, autoScroll]);

  // Process audio chunk queue when chunks arrive
  useEffect(() => {
    if (audioChunkQueue.length > 0 && waitingForWhisper.length > 0 && !isProcessingWhisper) {
      processNextWhisperVerification();
    }
  }, [audioChunkQueue.length, waitingForWhisper.length, isProcessingWhisper]);

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        enhancedLiveTranscriptionService.stopRecording();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, []);

  // Start enhanced session
  const startEnhancedSession = async () => {
    try {
      setRecordingError('');
      console.log('🚀 Starting enhanced session for meeting:', meetingId);
      
      const processedParticipants = participants.map((p, index) => {
        const participantId = p.id ? `participant_${p.id}` : `participant_${p.name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
        
        return {
          id: participantId,
          name: p.name,
          color: p.color || '#6B7280'
        };
      });
      
      const result = await enhancedLiveTranscriptionService.startEnhancedSession(
        meetingId,
        processedParticipants
      );

      if (result.success) {
        setSessionActive(true);
        setSessionId(result.session_id);
        
        if (result.voice_setup_required && participants.length > 0) {
          setVoiceSetupPhase(true);
          setCurrentSetupSpeaker(0);
          setVoiceSetupComplete(false);
        } else {
          setVoiceSetupPhase(false);
          setVoiceSetupComplete(true);
        }
      } else {
        setRecordingError(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('❌ Enhanced session exception:', error);
      setRecordingError('Failed to start enhanced session: ' + error.message);
    }
  };

  // Voice setup functions
  const startVoiceSetup = async () => {
    const speaker = participants[currentSetupSpeaker];
    if (!speaker) return;

    setVoiceSetupError('');
    setIsRecordingVoice(true);

    try {
      const audioBlob = await enhancedLiveTranscriptionService.recordVoiceSample(5000);
      const speakerId = speaker.id ? `participant_${speaker.id}` : `participant_${speaker.name.toLowerCase().replace(/\s+/g, '_')}_${currentSetupSpeaker}`;
      
      const result = await enhancedLiveTranscriptionService.setupVoiceProfile(speakerId, audioBlob);
      setIsRecordingVoice(false);

      if (result.success) {
        setVoiceSetupError('');
      } else {
        setVoiceSetupError(result.error || 'Voice setup failed');
      }
    } catch (error) {
      setIsRecordingVoice(false);
      setVoiceSetupError('Failed to record voice: ' + error.message);
    }
  };

  const nextSpeaker = () => {
    const nextIndex = currentSetupSpeaker + 1;
    if (nextIndex < participants.length) {
      setCurrentSetupSpeaker(nextIndex);
      setVoiceSetupError('');
    } else {
      completeVoiceSetup();
    }
  };

  const previousSpeaker = () => {
    if (currentSetupSpeaker > 0) {
      setCurrentSetupSpeaker(currentSetupSpeaker - 1);
      setVoiceSetupError('');
    }
  };

  const completeVoiceSetup = () => {
    setVoiceSetupPhase(false);
    setVoiceSetupComplete(true);
    setCurrentSetupSpeaker(0);
  };

  const skipVoiceSetup = () => {
    completeVoiceSetup();
  };

  // Start live transcription
  const startLiveTranscription = async () => {
    try {
      console.log('🚀 Starting live transcription...');
      setRecordingError('');

      if (!speechSupported) {
        setRecordingError('Speech recognition not supported in this browser');
        return;
      }

      const speechSetup = enhancedLiveTranscriptionService.setupSpeechRecognition(
        handleSpeechResult,
        handleSpeechError
      );

      if (!speechSetup) {
        setRecordingError('Failed to setup speech recognition');
        return;
      }

      // Setup chunk callback for Whisper processing - FIXED
      enhancedLiveTranscriptionService.setChunkCallback(handleAudioChunk);

      const recordingResult = await enhancedLiveTranscriptionService.startRecording();
      
      if (recordingResult.success) {
        setIsRecording(true);
        console.log('✅ Live transcription started successfully');
      } else {
        setRecordingError(recordingResult.error);
      }
    } catch (error) {
      console.error('❌ Live transcription start error:', error);
      setRecordingError('Failed to start transcription: ' + error.message);
    }
  };

  // FIXED: Handle speech recognition results
  const handleSpeechResult = async (result) => {
    const { transcript, confidence, isFinal, timestamp } = result;

    if (!isFinal) {
      setInterimTranscript(transcript);
      return;
    }

    setInterimTranscript('');

    if (!transcript.trim()) {
      return;
    }

    try {
      console.log('📤 Processing live transcript:', transcript.substring(0, 50) + '...');
      
      const apiResult = await enhancedLiveTranscriptionService.processLiveTranscription(
        transcript.trim(),
        confidence
      );

      if (apiResult.success) {
        const transcription = apiResult.transcription;
        
        console.log('✅ Live transcription processed:', {
          id: transcription.id,
          text: transcription.text.substring(0, 50) + '...',
          status: transcription.processing_status
        });
        
        // Add to live panel immediately
        setLiveTranscriptions(prev => [...prev, {
          ...transcription,
          panel: 'live',
          original_confidence: confidence,
          created_at: new Date().toISOString()
        }]);
        
        // FIXED: Add to waiting queue for Whisper verification (DON'T save to database yet)
        setWaitingForWhisper(prev => [...prev, {
          ...transcription,
          live_confidence: confidence,
          created_at: new Date().toISOString(),
          status: 'waiting_for_whisper'
        }]);
        
        console.log('🕐 Added to Whisper waiting queue:', transcription.id);
        
        // Update session stats
        if (apiResult.session_stats) {
          setSessionStats(apiResult.session_stats);
          onSessionStatsUpdate(apiResult.session_stats);
        }

        // DON'T call parent callback yet - wait for Whisper verification
        console.log('⏳ Waiting for Whisper verification before saving...');
      }
    } catch (error) {
      console.error('❌ Failed to process live transcription:', error);
    }
  };

  // Handle speech recognition errors
  const handleSpeechError = (error) => {
    if (error === 'not-allowed') {
      setRecordingError('Microfoon toegang geweigerd. Sta microfoon toegang toe.');
    } else if (error !== 'no-speech' && error !== 'network') {
      setRecordingError(`Speech recognition error: ${error}`);
    }
  };

  // FIXED: Handle audio chunk for Whisper processing
  const handleAudioChunk = async (audioBlob) => {
    console.log('🎵 Audio chunk received:', {
      size: audioBlob.size,
      type: audioBlob.type,
      waiting_count: waitingForWhisper.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Add chunk to queue with timestamp
    setAudioChunkQueue(prev => [...prev, {
      audioBlob,
      received_at: new Date().toISOString(),
      id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }]);
  };

  // FIXED: Process Whisper verification from queue
  const processNextWhisperVerification = async () => {
    if (isProcessingWhisper || audioChunkQueue.length === 0 || waitingForWhisper.length === 0) {
      return;
    }

    setIsProcessingWhisper(true);
    setWhisperProgress('Preparing...');

    try {
      // Get the oldest audio chunk
      const audioChunk = audioChunkQueue[0];
      const chunkAudioBlob = audioChunk.audioBlob;
      
      // Get the oldest waiting transcription
      const waitingTranscription = waitingForWhisper[0];

      console.log('🤖 Processing Whisper verification:', {
        chunk_id: audioChunk.id,
        transcription_id: waitingTranscription.id,
        text_preview: waitingTranscription.text.substring(0, 50) + '...',
        chunk_size: chunkAudioBlob.size
      });

      setWhisperProgress(`Verifying: ${waitingTranscription.text.substring(0, 30)}...`);

      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        waitingTranscription.id,
        chunkAudioBlob
      );

      console.log('🤖 Whisper result:', {
        success: result.success,
        has_transcription: !!result.transcription,
        error: result.error
      });

      if (result.success && result.transcription) {
        const whisperTranscription = result.transcription;
        
        console.log('✅ Whisper verification successful:', {
          original: waitingTranscription.text.substring(0, 50),
          whisper: whisperTranscription.text.substring(0, 50),
          improved: waitingTranscription.text.trim() !== whisperTranscription.text.trim()
        });

        // Add to Whisper panel
        setWhisperTranscriptions(prev => [...prev, {
          ...whisperTranscription,
          panel: 'whisper',
          original_live_text: waitingTranscription.text,
          original_live_id: waitingTranscription.id,
          improved: waitingTranscription.text.trim() !== whisperTranscription.text.trim(),
          chunk_processed_at: new Date().toISOString(),
          live_confidence: waitingTranscription.live_confidence
        }]);

        // NOW call parent callback with final verified transcription
        onTranscriptionUpdate({
          ...whisperTranscription,
          source: 'whisper_verified',
          original_live_text: waitingTranscription.text,
          live_confidence: waitingTranscription.live_confidence,
          whisper_confidence: whisperTranscription.text_confidence || 1.0
        });

        setWhisperProgress('Verification complete!');
      } else {
        console.warn('⚠️ Whisper verification failed:', result.error);
        
        // Fall back to live transcription for database storage
        console.log('💾 Falling back to live transcription for database...');
        onTranscriptionUpdate({
          ...waitingTranscription,
          source: 'live_fallback',
          confidence: waitingTranscription.live_confidence || 0.8
        });

        setWhisperProgress('Fallback to live transcription');
      }

      // Remove processed items from queues
      setAudioChunkQueue(prev => prev.slice(1));
      setWaitingForWhisper(prev => prev.slice(1));

    } catch (error) {
      console.error('❌ Whisper processing error:', error);
      setWhisperProgress('Processing failed');
      
      // Remove failed items from queues
      setAudioChunkQueue(prev => prev.slice(1));
      setWaitingForWhisper(prev => prev.slice(1));
    } finally {
      setIsProcessingWhisper(false);
      setTimeout(() => setWhisperProgress(''), 2000);
    }
  };

  // Stop transcription
  const stopTranscription = () => {
    try {
      enhancedLiveTranscriptionService.stopRecording();
      setInterimTranscript('');
      setIsRecording(false);
      setIsProcessingWhisper(false);
      
      // Clear all queues
      setWaitingForWhisper([]);
      setAudioChunkQueue([]);
      setWhisperProgress('');
      
      console.log('✅ Transcription stopped and queues cleared');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      setRecordingError('Error stopping recording: ' + error.message);
    }
  };

  // Voice setup UI
  if (voiceSetupPhase && !voiceSetupComplete) {
    const currentSpeakerData = participants[currentSetupSpeaker];
    const isLastSpeaker = currentSetupSpeaker >= participants.length - 1;
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            Stem Setup - Stap {currentSetupSpeaker + 1} van {participants.length}
          </h3>
          
          <button
            onClick={skipVoiceSetup}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Skip hele setup
          </button>
        </div>
        
        <div className="text-center">
          {currentSpeakerData ? (
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: currentSpeakerData.color || '#6B7280' }}
                >
                  {currentSpeakerData.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <h4 className="text-xl font-medium mb-2">{currentSpeakerData.name}</h4>
              <p className="text-gray-600 mb-4">
                Zeg je naam en een korte zin zodat het systeem je stem kan leren herkennen.
              </p>
              
              {isRecordingVoice ? (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-red-600 font-medium">Opname bezig... (5 seconden)</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Spreek nu duidelijk in de microfoon
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <button
                    onClick={startVoiceSetup}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    disabled={isRecordingVoice}
                  >
                    🎤 Start Stem Opname
                  </button>
                </div>
              )}

              {!isRecordingVoice && (
                <div className="flex justify-center space-x-4 mb-4">
                  <button
                    onClick={previousSpeaker}
                    disabled={currentSetupSpeaker === 0}
                    className={`px-4 py-2 rounded-lg ${
                      currentSetupSpeaker === 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                    }`}
                  >
                    ← Vorige
                  </button>
                  
                  {isLastSpeaker ? (
                    <button
                      onClick={completeVoiceSetup}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                    >
                      ✅ Setup Voltooien
                    </button>
                  ) : (
                    <button
                      onClick={nextSpeaker}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Volgende →
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 text-red-600">
              Fout: Geen deelnemer gevonden
            </div>
          )}
          
          {voiceSetupError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {voiceSetupError}
              <button 
                onClick={() => setVoiceSetupError('')} 
                className="ml-2 text-xs underline"
              >
                ✕
              </button>
            </div>
          )}
          
          <div className="flex justify-center space-x-2 mt-4">
            {participants.map((participant, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full cursor-pointer ${
                  index < currentSetupSpeaker ? 'bg-green-500' :
                  index === currentSetupSpeaker ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                onClick={() => !isRecordingVoice && setCurrentSetupSpeaker(index)}
                title={participant.name}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

// Main UI: Timeline-based transcription interface
  return (
    <div className="bg-white rounded-lg border">
      {/* Voice setup UI blijft hetzelfde */}
      {voiceSetupPhase && !voiceSetupComplete ? (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              Stem Setup - Stap {currentSetupSpeaker + 1} van {participants.length}
            </h3>
            
            <button
              onClick={skipVoiceSetup}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Skip hele setup
            </button>
          </div>
          
          <div className="text-center">
            {participants[currentSetupSpeaker] ? (
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: participants[currentSetupSpeaker].color || '#6B7280' }}
                  >
                    {participants[currentSetupSpeaker].name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <h4 className="text-xl font-medium mb-2">{participants[currentSetupSpeaker].name}</h4>
                <p className="text-gray-600 mb-4">
                  Zeg je naam en een korte zin zodat het systeem je stem kan leren herkennen.
                </p>
                
                {isRecordingVoice ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-red-600 font-medium">Opname bezig... (5 seconden)</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Spreek nu duidelijk in de microfoon
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <button
                      onClick={startVoiceSetup}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                      disabled={isRecordingVoice}
                    >
                      🎤 Start Stem Opname
                    </button>
                  </div>
                )}

                {!isRecordingVoice && (
                  <div className="flex justify-center space-x-4 mb-4">
                    <button
                      onClick={previousSpeaker}
                      disabled={currentSetupSpeaker === 0}
                      className={`px-4 py-2 rounded-lg ${
                        currentSetupSpeaker === 0 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      }`}
                    >
                      ← Vorige
                    </button>
                    
                    {currentSetupSpeaker >= participants.length - 1 ? (
                      <button
                        onClick={completeVoiceSetup}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                      >
                        ✅ Setup Voltooien
                      </button>
                    ) : (
                      <button
                        onClick={nextSpeaker}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Volgende →
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 text-red-600">
                Fout: Geen deelnemer gevonden
              </div>
            )}
            
            {voiceSetupError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {voiceSetupError}
                <button 
                  onClick={() => setVoiceSetupError('')} 
                  className="ml-2 text-xs underline"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="flex justify-center space-x-2 mt-4">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full cursor-pointer ${
                    index < currentSetupSpeaker ? 'bg-green-500' :
                    index === currentSetupSpeaker ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  onClick={() => !isRecordingVoice && setCurrentSetupSpeaker(index)}
                  title={participant.name}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // NIEUWE Timeline Transcription Interface
        <div>
          {/* Header met status */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <h3 className="font-medium">🎯 Enhanced Live Transcriptie</h3>
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-gray-600">
                  {isRecording ? 'Live Recording' : 'Gestopt'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {isProcessingWhisper && (
                <span className="text-blue-600 animate-pulse">🤖 Processing...</span>
              )}
              <span>Session: {sessionId ? sessionId.substring(0, 8) + '...' : 'None'}</span>
            </div>
          </div>

          {recordingError && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-3 text-sm">
              <div className="flex justify-between items-center">
                <span>{recordingError}</span>
                <button 
                  onClick={() => setRecordingError('')} 
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="p-3 bg-gray-50 border-b">
            {!sessionActive ? (
              <button
                onClick={startEnhancedSession}
                className="btn-primary w-full text-sm py-2"
                disabled={!speechSupported}
              >
                🚀 Start Enhanced Session
              </button>
            ) : !isRecording && voiceSetupComplete ? (
              <button
                onClick={startLiveTranscription}
                className="btn-success w-full text-sm py-2"
                disabled={!speechSupported}
              >
                🎤 Start Timeline Transcriptie
              </button>
            ) : isRecording ? (
              <button
                onClick={stopTranscription}
                className="btn-danger w-full text-sm py-2"
              >
                ⏹️ Stop Transcriptie
              </button>
            ) : null}
            
            {!speechSupported && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Speech recognition niet ondersteund. Gebruik Chrome of Edge.
              </p>
            )}

            {whisperProgress && (
              <div className="mt-2 text-xs text-blue-600 text-center">
                🤖 {whisperProgress}
              </div>
            )}
          </div>

          {/* Timeline Transcription Component */}
          <TimelineTranscription
            liveTranscriptions={liveTranscriptions}
            whisperTranscriptions={whisperTranscriptions}
            isRecording={isRecording}
            meetingStartTime={sessionActive ? new Date() : null}
            onTranscriptionUpdate={onTranscriptionUpdate}
          />
        </div>
      )}
    </div>
  );
};
export default EnhancedLiveTranscription;