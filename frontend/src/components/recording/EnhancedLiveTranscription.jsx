import React, { useState, useEffect, useRef } from 'react';
import enhancedLiveTranscriptionService from '../../services/api/enhancedLiveTranscriptionService';

const EnhancedLiveTranscription = ({ 
  meetingId, 
  participants = [], 
  onTranscriptionUpdate = () => {},
  onWhisperUpdate = () => {}, // NIEUWE PROP voor Whisper updates
  onSessionStatsUpdate = () => {}
}) => {
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Setup state
  const [setupPhase, setSetupPhase] = useState('initial'); // 'initial', 'voice_setup', 'ready'
  const [currentSetupSpeaker, setCurrentSetupSpeaker] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSetupError, setVoiceSetupError] = useState('');
  
  // Loading states
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [startupProgress, setStartupProgress] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingError, setRecordingError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);

  // Processing for background transcription
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);

  // Timer ref
  const timerRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        enhancedLiveTranscriptionService.stopRecording();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, []);

  // Format recording time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start enhanced session with voice setup choice
  const handleVoiceSetupChoice = async (useVoiceSetup) => {
    try {
      setIsStartingSession(true);
      setRecordingError('');
      setStartupProgress('Initialiseren...');
      
      console.log('🚀 Starting enhanced session for meeting:', meetingId);
      
      setStartupProgress('Deelnemers verwerken...');
      const processedParticipants = participants.map((p, index) => {
        const participantId = p.id ? `participant_${p.id}` : `participant_${p.name.toLowerCase().replace(/\s+/g, '_')}_${index}`;
        
        return {
          id: participantId,
          name: p.name,
          color: p.color || '#6B7280'
        };
      });
      
      setStartupProgress('Verbinden met server...');
      const result = await enhancedLiveTranscriptionService.startEnhancedSession(
        meetingId,
        processedParticipants
      );

      console.log('Enhanced session result:', result);

      if (result.success) {
        setStartupProgress('Session gestart!');
        setSessionActive(true);
        setSessionId(result.session_id);
        
        if (useVoiceSetup && participants.length > 0) {
          setSetupPhase('voice_setup');
          setCurrentSetupSpeaker(0);
        } else {
          setSetupPhase('ready');
        }
      } else {
        setRecordingError(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('❌ Enhanced session exception:', error);
      setRecordingError('Failed to start enhanced session: ' + error.message);
    } finally {
      setIsStartingSession(false);
      setTimeout(() => setStartupProgress(''), 2000);
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
      setSetupPhase('ready');
      setCurrentSetupSpeaker(0);
    }
  };

  const previousSpeaker = () => {
    if (currentSetupSpeaker > 0) {
      setCurrentSetupSpeaker(currentSetupSpeaker - 1);
      setVoiceSetupError('');
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      console.log('🚀 Starting recording...');
      setRecordingError('');

      if (!speechSupported) {
        setRecordingError('Speech recognition not supported in this browser');
        return;
      }

      // Setup speech recognition for background processing
      const speechSetup = enhancedLiveTranscriptionService.setupSpeechRecognition(
        handleBackgroundTranscription,
        handleSpeechError
      );

      if (!speechSetup) {
        setRecordingError('Failed to setup speech recognition');
        return;
      }

      // Setup chunk callback for background Whisper processing
      enhancedLiveTranscriptionService.setChunkCallback(handleBackgroundAudioChunk);

      const recordingResult = await enhancedLiveTranscriptionService.startRecording();
      
      if (recordingResult.success) {
        setIsRecording(true);
        setIsPaused(false);
        setRecordingTime(0);
        setRecordingStartTime(new Date());
        console.log('✅ Recording started successfully');
      } else {
        setRecordingError(recordingResult.error);
      }
    } catch (error) {
      console.error('❌ Recording start error:', error);
      setRecordingError('Failed to start recording: ' + error.message);
    }
  };

  // Pause recording
  const pauseRecording = () => {
    try {
      enhancedLiveTranscriptionService.pauseRecording();
      setIsPaused(true);
      console.log('⏸️ Recording paused');
    } catch (error) {
      console.error('❌ Error pausing recording:', error);
      setRecordingError('Error pausing recording: ' + error.message);
    }
  };

  // Resume recording
  const resumeRecording = () => {
    try {
      enhancedLiveTranscriptionService.resumeRecording();
      setIsPaused(false);
      console.log('▶️ Recording resumed');
    } catch (error) {
      console.error('❌ Error resuming recording:', error);
      setRecordingError('Error resuming recording: ' + error.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    try {
      enhancedLiveTranscriptionService.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      setRecordingStartTime(null);
      console.log('⏹️ Recording stopped');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      setRecordingError('Error stopping recording: ' + error.message);
    }
  };

  // Background transcription processing
  const handleBackgroundTranscription = async (result) => {
    const { transcript, confidence, isFinal } = result;

    if (!isFinal || !transcript.trim()) {
      return;
    }

    try {
      setIsProcessingBackground(true);
      
      const apiResult = await enhancedLiveTranscriptionService.processLiveTranscription(
        transcript.trim(),
        confidence
      );

      if (apiResult.success && apiResult.transcription) {
        // Send to parent callback for database storage
        onTranscriptionUpdate({
          ...apiResult.transcription,
          source: 'background_live',
          confidence: confidence
        });

        // Update session stats
        if (apiResult.session_stats) {
          onSessionStatsUpdate(apiResult.session_stats);
        }
      }
    } catch (error) {
      console.error('❌ Background transcription error:', error);
    } finally {
      setIsProcessingBackground(false);
    }
  };

  // Background audio chunk processing - MET WHISPER CALLBACK EN STATUS
  const handleBackgroundAudioChunk = async (audioBlob) => {
    try {
      console.log('🎵 Processing audio chunk with Whisper...', {
        size: audioBlob.size,
        timestamp: new Date().toLocaleTimeString()
      });

      // Process with Whisper in background
      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        `background_${Date.now()}`,
        audioBlob
      );

      if (result.success && result.transcription) {
        const transcriptionData = {
          ...result.transcription,
          source: 'background_whisper',
          confidence: result.transcription.text_confidence || 1.0,
          database_saved: result.transcription.database_saved || false
        };

        console.log('✅ Whisper transcription completed:', {
          text_preview: transcriptionData.text.substring(0, 50) + '...',
          database_saved: transcriptionData.database_saved,
          processing_status: transcriptionData.processing_status
        });

        // Send improved transcription to parent (voor algemene transcripties)
        onTranscriptionUpdate(transcriptionData);

        // Update het Whisper panel specifiek met real-time data
        if (onWhisperUpdate) {
          onWhisperUpdate({
            type: 'transcription_completed',
            transcription: transcriptionData,
            message: transcriptionData.database_saved 
              ? 'Whisper transcriptie opgeslagen in database' 
              : 'Whisper transcriptie verwerkt',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.warn('⚠️ Whisper processing failed:', result.error);
        
        // Notify parent about failure
        if (onWhisperUpdate) {
          onWhisperUpdate({
            type: 'processing_error',
            error: result.error,
            message: 'Whisper verwerking mislukt',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('❌ Background Whisper processing error:', error);
      
      // Notify parent about error
      if (onWhisperUpdate) {
        onWhisperUpdate({
          type: 'processing_error',
          error: error.message,
          message: 'Fout bij Whisper verwerking',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Handle speech recognition errors
  const handleSpeechError = (error) => {
    if (error === 'not-allowed') {
      setRecordingError('Microfoon toegang geweigerd. Sta microfoon toegang toe.');
    } else if (error !== 'no-speech' && error !== 'network') {
      console.warn('Speech recognition error:', error);
    }
  };

  // Debug: Add logging for button clicks
  const debugVoiceSetupClick = (useVoiceSetup) => {
    console.log('🔍 Voice setup button clicked:', { useVoiceSetup, meetingId, participants });
    if (!isStartingSession) {
      handleVoiceSetupChoice(useVoiceSetup);
    }
  };

  // INITIAL SETUP PHASE: Choose voice setup or skip
  if (setupPhase === 'initial' && !sessionActive) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center">
          
          {/* Loading State */}
          {isStartingSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-600 font-medium">Session wordt gestart...</span>
              </div>
              
              {startupProgress && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  {startupProgress}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Dit kan even duren, de server wordt opgestart...
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-sm text-gray-600 mb-6">
                Kies of je stemherkenning wilt instellen voor betere spreker identificatie
              </p>
              
              <button
                onClick={() => debugVoiceSetupClick(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!speechSupported || participants.length === 0 || isStartingSession}
              >
                🎤 Start met Voice Setup
              </button>
              
              <button
                onClick={() => debugVoiceSetupClick(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!speechSupported || isStartingSession}
              >
                ⏭️ Setup Overslaan
              </button>
              
              {!speechSupported && (
                <p className="text-xs text-red-600 mt-4">
                  Speech recognition niet ondersteund. Gebruik Chrome of Edge.
                </p>
              )}
              
              {participants.length === 0 && (
                <p className="text-xs text-orange-600 mt-2">
                  Geen deelnemers gevonden. Voice setup niet mogelijk.
                </p>
              )}

              {/* Debug info */}
              <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                Debug: meetingId={meetingId}, participants={participants.length}, speech={speechSupported ? 'OK' : 'NO'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VOICE SETUP PHASE
  if (setupPhase === 'voice_setup') {
    const currentSpeakerData = participants[currentSetupSpeaker];
    const isLastSpeaker = currentSetupSpeaker >= participants.length - 1;
    
    return (
      <div className="bg-white rounded-lg border">
        {/* Header */}
        <div className="p-4 border-b bg-blue-50">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-blue-800">
              🎤 Voice Setup - {currentSetupSpeaker + 1} van {participants.length}
            </h3>
            
            <button
              onClick={() => setSetupPhase('ready')}
              className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-3 rounded"
            >
              ⏭️ Setup Overslaan
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {currentSpeakerData ? (
            <div>
              {/* Speaker Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: currentSpeakerData.color || '#6B7280' }}
                >
                  {currentSpeakerData.name.charAt(0).toUpperCase()}
                </div>
                
                <div>
                  <h4 className="text-lg font-medium">{currentSpeakerData.name}</h4>
                  <p className="text-sm text-gray-600">
                    Spreek je naam en een korte zin voor stemherkenning
                  </p>
                </div>
              </div>
              
              {/* Recording Status */}
              <div className="text-center mb-6">
                {isRecordingVoice ? (
                  <div>
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-600 font-medium">
                        Opname bezig... (5 seconden)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Spreek nu duidelijk in de microfoon
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={startVoiceSetup}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
                    disabled={isRecordingVoice}
                  >
                    🎤 Start Stem Opname
                  </button>
                )}
              </div>

              {/* Navigation */}
              {!isRecordingVoice && (
                <div className="flex justify-center space-x-3 mb-4">
                  <button
                    onClick={previousSpeaker}
                    disabled={currentSetupSpeaker === 0}
                    className={`bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded ${currentSetupSpeaker === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    ← Vorige
                  </button>
                  
                  {isLastSpeaker ? (
                    <button
                      onClick={() => setSetupPhase('ready')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      ✅ Setup Voltooien
                    </button>
                  ) : (
                    <button
                      onClick={nextSpeaker}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Volgende →
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-3">❌</div>
              <p className="text-red-600">Fout: Geen deelnemer gevonden</p>
            </div>
          )}
          
          {/* Error Display */}
          {voiceSetupError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
              <div className="flex justify-between items-center">
                <span>{voiceSetupError}</span>
                <button 
                  onClick={() => setVoiceSetupError('')} 
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2 mt-6">
            {participants.map((participant, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
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

  // RECORDING PHASE
  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 
              isPaused ? 'bg-yellow-500' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              {isRecording && !isPaused ? 'Recording (90s chunks)' : 
               isPaused ? 'Gepauzeerd' : 'Gestopt'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {isProcessingBackground && (
            <span className="text-blue-600">🤖 Processing...</span>
          )}
        </div>
      </div>

      {/* Error Display */}
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

      {/* Recording Display */}
      <div className="p-6">
        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-mono text-slate-800 mb-2">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-slate-600">
            {isRecording ? (
              <span className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                <span>
                  {isPaused ? 'Opname gepauzeerd' : 
                   `90-seconden chunks actief sinds ${recordingStartTime ? recordingStartTime.toLocaleTimeString('nl-NL') : ''}`}
                </span>
              </span>
            ) : (
              'Opname gestopt'
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg"
              disabled={!speechSupported}
            >
              🎤 Start 90s Opname
            </button>
          ) : (
            <>
              {!isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6 py-3 rounded-lg"
                >
                  ⏸️ Pauzeren
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg"
                >
                  ▶️ Hervatten
                </button>
              )}
              
              <button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg"
              >
                ⏹️ Stoppen
              </button>
            </>
          )}
        </div>
        
        {!speechSupported && (
          <p className="text-xs text-red-600 mt-4 text-center">
            Speech recognition niet ondersteund. Gebruik Chrome of Edge.
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedLiveTranscription;