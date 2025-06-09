import React, { useState, useEffect, useRef } from 'react';
import enhancedLiveTranscriptionService from '../../services/api/enhancedLiveTranscriptionService';

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

  // Transcription state - SPLIT INTO TWO LISTS
  const [liveTranscriptions, setLiveTranscriptions] = useState([]); // Web Speech results
  const [whisperTranscriptions, setWhisperTranscriptions] = useState([]); // Whisper verified results
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recentLiveTranscriptions, setRecentLiveTranscriptions] = useState([]);

  // UI state
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs
  const liveTranscriptEndRef = useRef(null);
  const whisperTranscriptEndRef = useRef(null);
  const liveContainerRef = useRef(null);
  const whisperContainerRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    console.log('Speech recognition supported:', !!SpeechRecognition);
  }, []);

  // Auto-scroll for both panels
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

  // Component cleanup
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up EnhancedLiveTranscription component');
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
      console.log('Starting enhanced session for meeting:', meetingId);
      
      const processedParticipants = participants.map((p, index) => {
        const participantId = p.id ? `participant_${p.id}` : `participant_${p.name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
        
        return {
          id: participantId,
          name: p.name,
          color: p.color || '#6B7280'
        };
      });
      
      console.log('Processed participants for API:', processedParticipants);
      
      const result = await enhancedLiveTranscriptionService.startEnhancedSession(
        meetingId,
        processedParticipants
      );

      console.log('Enhanced session result:', result);

      if (result.success) {
        setSessionActive(true);
        setSessionId(result.session_id);
        
        if (result.voice_setup_required && participants.length > 0) {
          console.log('Voice setup required, starting setup phase');
          setVoiceSetupPhase(true);
          setCurrentSetupSpeaker(0);
          setVoiceSetupComplete(false);
        } else {
          console.log('No voice setup required, completing setup');
          setVoiceSetupPhase(false);
          setVoiceSetupComplete(true);
        }
      } else {
        const errorMessage = result.error || 'Failed to start session';
        console.error('Enhanced session error:', result);
        setRecordingError(errorMessage);
        
        if (result.errors) {
          console.error('Validation errors:', result.errors);
          const errorDetails = Object.entries(result.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          setRecordingError(`Validation error: ${errorDetails}`);
        }
      }
    } catch (error) {
      console.error('Enhanced session exception:', error);
      setRecordingError('Failed to start enhanced session: ' + error.message);
    }
  };

  // Voice setup functions (same as before)
  const startVoiceSetup = async () => {
    const speaker = participants[currentSetupSpeaker];
    if (!speaker) {
      console.error('No speaker found at index:', currentSetupSpeaker);
      return;
    }

    console.log(`Starting voice setup for: ${speaker.name}`);
    
    setVoiceSetupError('');
    setIsRecordingVoice(true);

    try {
      const audioBlob = await enhancedLiveTranscriptionService.recordVoiceSample(5000);
      console.log('Voice sample recorded, size:', audioBlob.size);
      
      const speakerId = speaker.id ? `participant_${speaker.id}` : `participant_${speaker.name.toLowerCase().replace(/\s+/g, '_')}_${currentSetupSpeaker}`;
      
      const result = await enhancedLiveTranscriptionService.setupVoiceProfile(
        speakerId,
        audioBlob
      );

      console.log('Voice profile setup result:', result);
      setIsRecordingVoice(false);

      if (result.success) {
        console.log('✅ Voice setup completed for:', speaker.name);
        setVoiceSetupError('');
      } else {
        setVoiceSetupError(result.error || 'Voice setup failed');
      }
    } catch (error) {
      console.error('Voice setup error:', error);
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
    console.log('🎉 Voice setup completed, switching to transcription mode');
    setVoiceSetupPhase(false);
    setVoiceSetupComplete(true);
    setCurrentSetupSpeaker(0);
  };

  const skipVoiceSetup = () => {
    console.log('⏭️ Skipping voice setup');
    completeVoiceSetup();
  };

  // Start live transcription
  const startLiveTranscription = async () => {
    try {
      console.log('Starting live transcription...');
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

      enhancedLiveTranscriptionService.setChunkCallback(handleAudioChunk);

      const recordingResult = await enhancedLiveTranscriptionService.startRecording();
      console.log('Recording start result:', recordingResult);
      
      if (recordingResult.success) {
        setIsRecording(true);
        console.log('✅ Live transcription started successfully');
      } else {
        setRecordingError(recordingResult.error);
      }
    } catch (error) {
      console.error('Live transcription start error:', error);
      setRecordingError('Failed to start transcription: ' + error.message);
    }
  };

  // Handle speech recognition results - ADD TO LIVE PANEL
  const handleSpeechResult = async (result) => {
    const { transcript, confidence, isFinal, timestamp } = result;
    console.log('🎤 WebSpeech result:', { 
      transcript, 
      confidence, 
      isFinal, 
      source: 'browser_webspeech',
      timestamp: new Date().toLocaleTimeString()
    });

    if (!isFinal) {
      setInterimTranscript(transcript);
      return;
    }

    setInterimTranscript('');

    if (!transcript.trim()) {
      console.log('Empty transcript, skipping');
      return;
    }

    // Process final transcript
    try {
      console.log('📤 Sending to API for processing:', transcript);
      const apiResult = await enhancedLiveTranscriptionService.processLiveTranscription(
        transcript.trim(),
        confidence
      );

      console.log('📥 API Response:', apiResult);

      if (apiResult.success) {
        const transcription = apiResult.transcription;
        console.log('✅ Transcription added to LIVE panel:', {
          id: transcription.id,
          processing_status: transcription.processing_status,
          source: transcription.type || 'live'
        });
        
        // Add to LIVE transcriptions (left panel)
        setLiveTranscriptions(prev => [...prev, {
          ...transcription,
          panel: 'live',
          original_confidence: confidence
        }]);
        
        // Keep track for Whisper processing
        setRecentLiveTranscriptions(prev => [...prev.slice(-4), transcription]);
        
        // Update session stats
        if (apiResult.session_stats) {
          setSessionStats(apiResult.session_stats);
          onSessionStatsUpdate(apiResult.session_stats);
        }

        // Call parent callback
        onTranscriptionUpdate(apiResult.transcription);
      } else {
        console.error('Live transcription processing failed:', apiResult.error);
      }
    } catch (error) {
      console.error('Failed to process live transcription:', error);
    }
  };

  // Handle speech recognition errors
  const handleSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    
    if (error === 'not-allowed') {
      setRecordingError('Microfoon toegang geweigerd. Sta microfoon toegang toe.');
    } else if (error === 'no-speech') {
      console.log('No speech detected, continuing...');
    } else if (error === 'network') {
      console.log('Network error in speech recognition, this is normal');
    } else {
      setRecordingError(`Speech recognition error: ${error}`);
    }
  };

  // Handle audio chunk for Whisper processing - ADD TO WHISPER PANEL
  const handleAudioChunk = async (audioBlob) => {
    console.log('🎵 Audio chunk received for Whisper verification:', {
      size: audioBlob.size,
      type: audioBlob.type,
      timestamp: new Date().toLocaleTimeString(),
      recent_live_count: recentLiveTranscriptions.length
    });
    
    const recentLive = recentLiveTranscriptions
      .filter(t => t.processing_status === 'live')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!recentLive) {
      console.log('❌ No recent live transcription to verify');
      return;
    }

    console.log('🔍 Found live transcription to verify:', {
      id: recentLive.id,
      text: recentLive.text?.substring(0, 50) + '...',
      processing_status: recentLive.processing_status
    });

    try {
      console.log('📤 Sending to Whisper for verification...');
      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        recentLive.id,
        audioBlob
      );

      console.log('🤖 Whisper verification result:', {
        success: result.success,
        original_text: recentLive.text,
        whisper_text: result.success ? result.transcription?.text : 'N/A',
        improved: result.success ? (recentLive.text !== result.transcription?.text) : false
      });

      if (result.success) {
        console.log('✅ Whisper verification completed - adding to WHISPER panel');

        // Add to WHISPER transcriptions (right panel)
        setWhisperTranscriptions(prev => [...prev, {
          ...result.transcription,
          panel: 'whisper',
          original_live_text: recentLive.text,
          improved: recentLive.text !== result.transcription.text
        }]);

        // Remove from recent live list
        setRecentLiveTranscriptions(prev => 
          prev.filter(t => t.id !== recentLive.id)
        );

        // Call parent callback with Whisper result
        onTranscriptionUpdate({
          ...result.transcription,
          source: 'whisper_verified',
          original_live_text: recentLive.text
        });
      }
    } catch (error) {
      console.error('❌ Whisper verification failed:', error);
    }
  };

  // Stop transcription
  const stopTranscription = () => {
    console.log('🛑 Stopping transcription...');
    
    try {
      enhancedLiveTranscriptionService.stopRecording();
      setInterimTranscript('');
      setIsRecording(false);
      console.log('✅ Transcription stopped successfully');
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingError('Error stopping recording: ' + error.message);
    }
  };

  // Voice setup UI (same as before)
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

  // MAIN UI: Side-by-side comparison
  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium">🎤 Enhanced Live Transcriptie - Side by Side</h3>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              {isRecording ? 'Live' : 'Gestopt'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {sessionStats && (
            <div className="text-xs text-gray-500">
              Live: {liveTranscriptions.length} | Whisper: {whisperTranscriptions.length}
            </div>
          )}
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
            🚀 Start Enhanced Transcriptie
          </button>
        ) : !isRecording && voiceSetupComplete ? (
          <button
            onClick={startLiveTranscription}
            className="btn-success w-full text-sm py-2"
            disabled={!speechSupported}
          >
            🎤 Start Live Transcriptie
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
      </div>

      {/* SIDE-BY-SIDE TRANSCRIPTION PANELS */}
      <div className="grid grid-cols-2 gap-4 p-4">
        
        {/* LEFT PANEL: Live Web Speech Results */}
        <div className="border rounded-lg">
          <div className="bg-blue-50 px-3 py-2 border-b">
            <h4 className="font-medium text-blue-800 text-sm flex items-center space-x-2">
              <span>🎤</span>
              <span>Web Speech API (Live)</span>
              <span className="text-xs bg-blue-200 px-2 py-1 rounded">{liveTranscriptions.length}</span>
            </h4>
          </div>
          
          <div 
            ref={liveContainerRef}
            className="h-64 overflow-y-auto p-3"
          >
            {liveTranscriptions.length === 0 && !interimTranscript ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">🎤</div>
                <p className="text-sm">Live Web Speech results verschijnen hier</p>
              </div>
            ) : (
              <div className="space-y-2">
                {liveTranscriptions.map((transcription) => (
                  <div key={transcription.id} className="bg-blue-50 rounded p-2 border-l-4 border-blue-400">
                    <div className="flex items-center space-x-2 mb-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: transcription.speaker_color }}
                      ></div>
                      <span className="font-medium text-xs text-blue-700">
                        {transcription.speaker_name}
                      </span>
                      <span className="text-xs text-blue-600">
                        {Math.round((transcription.original_confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="text-sm text-blue-900">{transcription.text}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {new Date(transcription.timestamp).toLocaleTimeString('nl-NL', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Interim results */}
                {interimTranscript && (
                  <div className="bg-blue-100 rounded p-2 border-l-4 border-blue-300 opacity-60">
                    <div className="text-blue-600 italic text-sm">
                      {interimTranscript}
                    </div>
                    <div className="text-xs text-blue-500">
                      typing...
                    </div>
                  </div>
                )}
                
                <div ref={liveTranscriptEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Whisper Verified Results */}
        <div className="border rounded-lg">
          <div className="bg-green-50 px-3 py-2 border-b">
            <h4 className="font-medium text-green-800 text-sm flex items-center space-x-2">
              <span>🤖</span>
              <span>Azure Whisper (Verified)</span>
              <span className="text-xs bg-green-200 px-2 py-1 rounded">{whisperTranscriptions.length}</span>
            </h4>
          </div>
          
          <div 
            ref={whisperContainerRef}
            className="h-64 overflow-y-auto p-3"
          >
            {whisperTranscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">🤖</div>
                <p className="text-sm">Whisper verified results verschijnen hier</p>
                <p className="text-xs mt-1">Na ~30 seconden audio chunks</p>
              </div>
            ) : (
              <div className="space-y-2">
                {whisperTranscriptions.map((transcription) => (
                  <div key={transcription.id} className="bg-green-50 rounded p-2 border-l-4 border-green-400">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: transcription.speaker_color }}
                        ></div>
                        <span className="font-medium text-xs text-green-700">
                          {transcription.speaker_name}
                        </span>
                        {transcription.improved && (
                          <span className="text-xs bg-orange-200 text-orange-700 px-1 rounded">
                            IMPROVED
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-green-600">
                        {Math.round((transcription.text_confidence || 0) * 100)}%
                      </span>
                    </div>
                    
                    <div className="text-sm text-green-900 font-medium">{transcription.text}</div>
                    
                    {/* Show original if improved */}
                    {transcription.improved && transcription.original_live_text && (
                      <div className="text-xs text-gray-600 mt-1 p-1 bg-gray-100 rounded">
                        <span className="font-medium">Was:</span> {transcription.original_live_text}
                      </div>
                    )}
                    
                    <div className="text-xs text-green-600 mt-1">
                      {new Date(transcription.verified_at || transcription.timestamp).toLocaleTimeString('nl-NL', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                
                <div ref={whisperTranscriptEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {isRecording && (
        <div className="p-2 bg-gray-100 border-t text-xs text-gray-500 flex justify-between">
          <span>🎤 Recording Active</span>
          <span>Live: {liveTranscriptions.length} | Whisper: {whisperTranscriptions.length}</span>
          <span>{sessionId ? `Session: ${sessionId.substring(0, 8)}...` : 'No Session'}</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedLiveTranscription;