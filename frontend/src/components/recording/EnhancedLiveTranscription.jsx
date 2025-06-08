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

  // Transcription state
  const [transcriptions, setTranscriptions] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recentLiveTranscriptions, setRecentLiveTranscriptions] = useState([]);

  // UI state
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs
  const transcriptEndRef = useRef(null);
  const transcriptContainerRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    console.log('Speech recognition supported:', !!SpeechRecognition);
  }, []);

  // Auto-scroll effect - FIXED
  useEffect(() => {
    if (autoScroll && transcriptEndRef.current && transcriptions.length > 0) {
      // Only scroll if we actually have new content
      setTimeout(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [transcriptions.length, autoScroll]); // Only trigger on new transcriptions, not interim

  // Component cleanup - IMPROVED
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
      
      const result = await enhancedLiveTranscriptionService.startEnhancedSession(
        meetingId,
        participants.map(p => ({
          id: p.id || `participant_${p.name}`,
          name: p.name,
          color: p.color || '#6B7280'
        }))
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
        setRecordingError(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Enhanced session error:', error);
      setRecordingError('Failed to start enhanced session: ' + error.message);
    }
  };

  // Voice setup process - MANUAL CONTROL VERSION
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
      
      const result = await enhancedLiveTranscriptionService.setupVoiceProfile(
        speaker.id || `participant_${speaker.name}`,
        audioBlob
      );

      console.log('Voice profile setup result:', result);
      setIsRecordingVoice(false);

      if (result.success) {
        // DON'T auto-advance - wait for user to click next
        console.log('✅ Voice setup completed for:', speaker.name);
        setVoiceSetupError(''); // Clear any previous errors
      } else {
        setVoiceSetupError(result.error || 'Voice setup failed');
      }
    } catch (error) {
      console.error('Voice setup error:', error);
      setIsRecordingVoice(false);
      setVoiceSetupError('Failed to record voice: ' + error.message);
    }
  };

  // Manual next speaker
  const nextSpeaker = () => {
    const nextIndex = currentSetupSpeaker + 1;
    if (nextIndex < participants.length) {
      setCurrentSetupSpeaker(nextIndex);
      setVoiceSetupError('');
    } else {
      // All done
      completeVoiceSetup();
    }
  };

  // Manual previous speaker
  const previousSpeaker = () => {
    if (currentSetupSpeaker > 0) {
      setCurrentSetupSpeaker(currentSetupSpeaker - 1);
      setVoiceSetupError('');
    }
  };

  // Complete voice setup and move to transcription
  const completeVoiceSetup = () => {
    console.log('🎉 Voice setup completed, switching to transcription mode');
    setVoiceSetupPhase(false);
    setVoiceSetupComplete(true);
    setCurrentSetupSpeaker(0); // Reset for next time
  };

  // Skip voice setup (for testing)
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

      // Setup speech recognition
      const speechSetup = enhancedLiveTranscriptionService.setupSpeechRecognition(
        handleSpeechResult,
        handleSpeechError
      );

      if (!speechSetup) {
        setRecordingError('Failed to setup speech recognition');
        return;
      }

      // Setup audio chunk processing
      enhancedLiveTranscriptionService.setChunkCallback(handleAudioChunk);

      // Start recording
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

  // Handle speech recognition results
  const handleSpeechResult = async (result) => {
    const { transcript, confidence, isFinal, timestamp } = result;
    console.log('Speech result:', { transcript, confidence, isFinal });

    if (!isFinal) {
      setInterimTranscript(transcript);
      return;
    }

    // Clear interim transcript
    setInterimTranscript('');

    if (!transcript.trim()) {
      console.log('Empty transcript, skipping');
      return;
    }

    // Process final transcript
    try {
      console.log('Processing live transcription:', transcript);
      const apiResult = await enhancedLiveTranscriptionService.processLiveTranscription(
        transcript.trim(),
        confidence
      );

      console.log('Live transcription API result:', apiResult);

      if (apiResult.success) {
        const transcription = apiResult.transcription;
        
        // Add to transcriptions
        setTranscriptions(prev => [...prev, transcription]);
        
        // Keep track of recent live transcriptions for Whisper processing
        setRecentLiveTranscriptions(prev => [...prev.slice(-4), transcription]);
        
        // Update session stats
        if (apiResult.session_stats) {
          setSessionStats(apiResult.session_stats);
          onSessionStatsUpdate(apiResult.session_stats);
        }

        // Callback to parent
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
      // This is normal, don't show error
      console.log('No speech detected, continuing...');
    } else if (error === 'network') {
      console.log('Network error in speech recognition, this is normal');
    } else {
      setRecordingError(`Speech recognition error: ${error}`);
    }
  };

  // Handle audio chunk for Whisper processing
  const handleAudioChunk = async (audioBlob) => {
    console.log('Processing audio chunk for Whisper verification, size:', audioBlob.size);
    
    // Find the most recent live transcription to verify
    const recentLive = recentLiveTranscriptions
      .filter(t => t.processing_status === 'live')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!recentLive) {
      console.log('No recent live transcription to verify');
      return;
    }

    try {
      console.log('Sending audio chunk to Whisper for verification of:', recentLive.id);
      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        recentLive.id,
        audioBlob
      );

      console.log('Whisper verification result:', result);

      if (result.success) {
        // Update transcription with Whisper result
        setTranscriptions(prev => prev.map(t => 
          t.id === recentLive.id ? result.transcription : t
        ));

        // Remove from recent live list
        setRecentLiveTranscriptions(prev => 
          prev.filter(t => t.id !== recentLive.id)
        );

        console.log('✅ Whisper verification completed for:', recentLive.id);
      }
    } catch (error) {
      console.error('Failed to process Whisper verification:', error);
    }
  };

  // Stop transcription - IMPROVED
  const stopTranscription = () => {
    console.log('🛑 Stopping transcription...');
    
    try {
      // Stop all recording activities
      enhancedLiveTranscriptionService.stopRecording();
      
      // Clear interim transcript
      setInterimTranscript('');
      
      // Update state
      setIsRecording(false);
      
      console.log('✅ Transcription stopped successfully');
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingError('Error stopping recording: ' + error.message);
    }
  };

  // Handle scroll to control auto-scroll
  const handleScroll = () => {
    if (transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      setAutoScroll(isAtBottom);
    }
  };

  // Manual scroll to bottom
  const scrollToBottom = () => {
    setAutoScroll(true);
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get status indicator for transcription
  const getStatusIndicator = (transcription) => {
    switch (transcription.processing_status) {
      case 'live':
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-blue-600">Live</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-spin mr-2"></div>
            <span className="text-xs text-yellow-600">Verwerken...</span>
          </div>
        );
      case 'verified':
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-green-600">Geverifieerd</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-red-600">Fout</span>
          </div>
        );
      default:
        return null;
    }
  };

// Voice setup UI - MANUAL CONTROL VERSION
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

              {/* Navigation buttons - only show when not recording */}
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
          
          {/* Progress indicators */}
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

  // Main transcription UI
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Enhanced Live Transcriptie</h3>
        
        <div className="flex items-center space-x-4">
          {sessionStats && (
            <div className="text-sm text-gray-600">
              Live: {sessionStats.status_breakdown?.live || 0} | 
              Geverifieerd: {sessionStats.status_breakdown?.verified || 0}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isRecording ? 'Live transcriptie actief' : 'Gestopt'}
            </span>
          </div>
          
          {!autoScroll && transcriptions.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-300 rounded"
            >
              ↓ Naar beneden
            </button>
          )}
        </div>
      </div>

      {recordingError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {recordingError}
          <button 
            onClick={() => setRecordingError('')} 
            className="ml-2 text-xs underline"
          >
            Verbergen
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="mb-4">
        {!sessionActive ? (
          <button
            onClick={startEnhancedSession}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            disabled={!speechSupported}
          >
            🚀 Start Enhanced Transcriptie
          </button>
        ) : !isRecording && voiceSetupComplete ? (
          <button
            onClick={startLiveTranscription}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
            disabled={!speechSupported}
          >
            🎤 Start Live Transcriptie
          </button>
        ) : isRecording ? (
          <button
            onClick={stopTranscription}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            ⏹️ Stop Transcriptie
          </button>
        ) : (
          <div className="text-gray-500">
            Voice setup voltooid. Klik "Start Live Transcriptie" om te beginnen.
          </div>
        )}
        
        {!speechSupported && (
          <p className="text-sm text-red-600 mt-2">
            Speech recognition wordt niet ondersteund in deze browser. Gebruik Chrome of Edge.
          </p>
        )}
      </div>

      {/* Transcription Display */}
      <div 
        ref={transcriptContainerRef}
        onScroll={handleScroll}
        className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* Auto-scroll toggle */}
        {transcriptions.length > 0 && (
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
            <span className="text-xs text-gray-500">
              {transcriptions.length} transcripties
            </span>
            <label className="flex items-center text-xs text-gray-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="mr-1"
              />
              Auto-scroll
            </label>
          </div>
        )}

        {transcriptions.length === 0 && !interimTranscript ? (
          <p className="text-gray-500 text-center py-8">
            {!sessionActive 
              ? 'Klik "Start Enhanced Transcriptie" om te beginnen...'
              : !voiceSetupComplete
              ? 'Voice setup aan de gang...'
              : !isRecording
              ? 'Klik "Start Live Transcriptie" om te beginnen met spreken...'
              : 'Spreek in de microfoon om live transcriptie te zien...'
            }
          </p>
        ) : (
          <div className="space-y-3">
            {transcriptions.map((transcription) => (
              <div key={transcription.id} className="flex items-start space-x-3">
                <div 
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: transcription.speaker_color }}
                  title={transcription.speaker_name}
                ></div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-700">
                      {transcription.speaker_name}
                    </span>
                    {getStatusIndicator(transcription)}
                  </div>
                  
                  <div className={`text-gray-900 leading-relaxed ${
                    transcription.processing_status === 'verified' ? 'font-medium' : ''
                  }`}>
                    {transcription.text}
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(transcription.timestamp).toLocaleTimeString('nl-NL')} •{' '}
                    {Math.round((transcription.text_confidence || 0) * 100)}% •{' '}
                    {transcription.speaker_confidence && 
                      `Speaker: ${Math.round(transcription.speaker_confidence * 100)}%`
                    }
                  </div>
                </div>
              </div>
            ))}
            
            {/* Interim results */}
            {interimTranscript && (
              <div className="flex items-start space-x-3 opacity-60">
                <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-gray-400"></div>
                
                <div className="flex-1">
                  <div className="text-gray-600 italic leading-relaxed">
                    {interimTranscript}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    aan het typen...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* Debug Info */}
      {isRecording && (
        <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          🎤 Microfoon actief | 
          📝 Transcripties: {transcriptions.length} | 
          🔄 Interim: {interimTranscript ? 'Ja' : 'Nee'} |
          ⏱️ Session: {sessionId ? sessionId.substring(0, 10) + '...' : 'Geen'}
        </div>
      )}
    </div>
  );
};

export default EnhancedLiveTranscription;
