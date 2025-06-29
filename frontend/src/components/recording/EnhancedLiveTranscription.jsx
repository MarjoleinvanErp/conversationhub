import React, { useState, useEffect, useRef } from 'react';
import enhancedLiveTranscriptionService from '../../services/api/enhancedLiveTranscriptionService';
import configService from '../../services/configService';

const EnhancedLiveTranscription = ({ 
  meetingId, 
  participants = [], 
  onTranscriptionUpdate = () => {},
  onWhisperUpdate = () => {},
  onSessionStatsUpdate = () => {}
}) => {
  // Config state
  const [transcriptionConfig, setTranscriptionConfig] = useState({
    live_webspeech_enabled: false,
    whisper_enabled: true,
    whisper_chunk_duration: 90
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Setup state
  const [setupPhase, setSetupPhase] = useState('initial');
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
  const chunkTimerRef = useRef(null);

  // Config laden bij component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await configService.getTranscriptionConfig();
        setTranscriptionConfig(config);
        setConfigLoaded(true);
        console.log('📋 Transcriptie config geladen:', config);
      } catch (error) {
        console.error('❌ Fout bij laden transcriptie config:', error);
        setConfigLoaded(true);
      }
    };
    
    loadConfig();
  }, []);

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
        if (chunkTimerRef.current) {
          clearInterval(chunkTimerRef.current);
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
      console.log('📋 Using config:', transcriptionConfig);
      
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

  // Start recording with config-based behavior
  const startRecording = async () => {
    try {
      console.log('🚀 Starting recording with config:', transcriptionConfig);
      setRecordingError('');

      // Check if any transcription method is enabled
      if (!transcriptionConfig.live_webspeech_enabled && !transcriptionConfig.whisper_enabled) {
        setRecordingError('Geen transcriptie methoden ingeschakeld. Controleer de configuratie.');
        return;
      }

      // Setup WebSpeech if enabled
      if (transcriptionConfig.live_webspeech_enabled) {
        if (!speechSupported) {
          setRecordingError('Speech recognition not supported in this browser');
          return;
        }

        console.log('🎤 Setting up WebSpeech recognition...');
        const speechSetup = enhancedLiveTranscriptionService.setupSpeechRecognition(
          handleBackgroundTranscription,
          handleSpeechError
        );

        if (!speechSetup) {
          setRecordingError('Failed to setup speech recognition');
          return;
        }
      } else {
        console.log('🔇 WebSpeech uitgeschakeld via configuratie');
      }

      // Setup Whisper chunks if enabled
      if (transcriptionConfig.whisper_enabled) {
        console.log(`🤖 Setting up Whisper chunks (${transcriptionConfig.whisper_chunk_duration}s intervals)...`);
        enhancedLiveTranscriptionService.setChunkCallback(handleBackgroundAudioChunk);
      } else {
        console.log('🔇 Whisper transcriptie uitgeschakeld via configuratie');
      }

      const recordingResult = await enhancedLiveTranscriptionService.startRecording();
      
      if (recordingResult.success) {
        setIsRecording(true);
        setIsPaused(false);
        setRecordingTime(0);
        setRecordingStartTime(new Date());
        
        // Start Whisper chunk timer if enabled
        if (transcriptionConfig.whisper_enabled) {
          startWhisperChunkTimer();
        }
        
        console.log('✅ Recording started successfully');
        console.log(`📋 WebSpeech: ${transcriptionConfig.live_webspeech_enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`📋 Whisper: ${transcriptionConfig.whisper_enabled ? 'Enabled' : 'Disabled'} (${transcriptionConfig.whisper_chunk_duration}s chunks)`);
      } else {
        setRecordingError(recordingResult.error);
      }
    } catch (error) {
      console.error('❌ Recording start error:', error);
      setRecordingError('Failed to start recording: ' + error.message);
    }
  };

  // Start Whisper chunk processing timer
  const startWhisperChunkTimer = () => {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
    }

    const chunkDuration = transcriptionConfig.whisper_chunk_duration * 1000;
    
    chunkTimerRef.current = setInterval(() => {
      if (isRecording && !isPaused && transcriptionConfig.whisper_enabled) {
        console.log(`⏰ Whisper chunk timer triggered (${transcriptionConfig.whisper_chunk_duration}s interval)`);
      }
    }, chunkDuration);
  };

  // Stop Whisper chunk timer
  const stopWhisperChunkTimer = () => {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  };

  // Pause recording
  const pauseRecording = () => {
    try {
      enhancedLiveTranscriptionService.pauseRecording();
      setIsPaused(true);
      stopWhisperChunkTimer();
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
      if (transcriptionConfig.whisper_enabled) {
        startWhisperChunkTimer();
      }
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
      stopWhisperChunkTimer();
      console.log('⏹️ Recording stopped');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      setRecordingError('Error stopping recording: ' + error.message);
    }
  };

  // Background transcription processing (WebSpeech) - UPDATED MET AUDIO VOOR SPEAKER DETECTION
  const handleBackgroundTranscription = async (result) => {
    // Skip if WebSpeech is disabled
    if (!transcriptionConfig.live_webspeech_enabled) {
      console.log('🔇 WebSpeech transcription skipped (disabled in config)');
      return;
    }

    const { transcript, confidence, isFinal } = result;

    if (!isFinal || !transcript.trim()) {
      return;
    }

    try {
      setIsProcessingBackground(true);
      console.log('🎤 Processing WebSpeech transcription with speaker detection:', transcript.substring(0, 50) + '...');
      
      // NIEUW: Probeer audio sample te krijgen voor speaker detection
      let audioSample = null;
      try {
        // Get current audio chunk for speaker identification (simplified approach)
        if (enhancedLiveTranscriptionService.audioStream) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(enhancedLiveTranscriptionService.audioStream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          // Create a small audio sample for speaker detection
          const audioData = new Float32Array(4096);
          processor.onaudioprocess = (e) => {
            const inputBuffer = e.inputBuffer.getChannelData(0);
            audioData.set(inputBuffer);
          };
          
          source.connect(processor);
          processor.connect(audioContext.destination);
          
          // Convert to blob for API
          audioSample = new Blob([audioData], { type: 'audio/raw' });
          
          // Cleanup
          setTimeout(() => {
            processor.disconnect();
            source.disconnect();
            audioContext.close();
          }, 100);
        }
      } catch (audioError) {
        console.warn('⚠️ Could not capture audio for speaker detection:', audioError.message);
      }
      
      console.log('📤 Calling API with transcript and audio sample...', {
        hasAudioSample: !!audioSample,
        audioSize: audioSample?.size || 0
      });
      
      const apiResult = await enhancedLiveTranscriptionService.processLiveTranscription(
        transcript.trim(),
        confidence,
        audioSample // NIEUW: Audio sample voor speaker detection
      );

      console.log('📥 API Response with speaker identification:', {
        success: apiResult.success,
        transcription_id: apiResult.transcription?.id,
        identified_speaker: apiResult.speaker_identification?.speaker_id,
        speaker_confidence: apiResult.speaker_identification?.confidence,
        error: apiResult.error
      });

      if (apiResult.success && apiResult.transcription) {
        const transcriptionFromAPI = apiResult.transcription;
        
        console.log('✅ Transcription created with speaker identification:', {
          id: transcriptionFromAPI.id,
          speaker: transcriptionFromAPI.speaker_name,
          speaker_confidence: transcriptionFromAPI.speaker_confidence
        });
        
        // Send to parent callback met speaker info
        onTranscriptionUpdate({
          ...transcriptionFromAPI,
          source: 'background_live',
          confidence: confidence,
          // NIEUW: Speaker detection info voor UI
          speakerDetection: {
            method: apiResult.speaker_identification?.method || 'fallback',
            confidence: apiResult.speaker_identification?.confidence || 0.0,
            identified: apiResult.speaker_identification?.speaker_id !== 'unknown_speaker'
          }
        });

        // Update session stats
        if (apiResult.session_stats) {
          onSessionStatsUpdate(apiResult.session_stats);
        }

        // Store transcription ID for Whisper verification
        if (transcriptionConfig.whisper_enabled) {
          window.lastTranscriptionForWhisper = {
            id: transcriptionFromAPI.id,
            text: transcriptionFromAPI.text,
            speaker_id: transcriptionFromAPI.speaker_id,
            timestamp: new Date().toISOString()
          };
          
          console.log('📝 Stored for Whisper verification with speaker info:', window.lastTranscriptionForWhisper);
        }
      } else {
        console.error('❌ API call failed:', apiResult.error);
      }
    } catch (error) {
      console.error('❌ Background transcription error:', error);
    } finally {
      setIsProcessingBackground(false);
    }
  };

  // Background audio chunk processing - UPDATED MET SPEAKER DETECTION
  const handleBackgroundAudioChunk = async (audioBlob) => {
    // Skip if Whisper is disabled
    if (!transcriptionConfig.whisper_enabled) {
      console.log('🔇 Whisper chunk processing skipped (disabled in config)');
      return;
    }

    try {
      console.log('🎵 Processing audio chunk with Whisper and speaker detection...', {
        size: audioBlob.size,
        timestamp: new Date().toLocaleTimeString(),
        chunkDuration: transcriptionConfig.whisper_chunk_duration + 's'
      });

      // Get transcription ID voor Whisper verification
      let transcriptionId = `background_${Date.now()}`; // fallback
      
      if (window.lastTranscriptionForWhisper && window.lastTranscriptionForWhisper.id) {
        transcriptionId = window.lastTranscriptionForWhisper.id;
        console.log('✅ Using real transcription ID for Whisper with speaker info:', {
          transcriptionId,
          original_speaker: window.lastTranscriptionForWhisper.speaker_id
        });
        
        // Clear it after use to prevent reuse
        delete window.lastTranscriptionForWhisper;
      } else {
        console.log('⚠️ No recent transcription found, using fallback ID:', transcriptionId);
        
        // Create a dummy transcription for this audio chunk with speaker detection
        try {
          console.log('📝 Creating transcription entry for audio chunk with speaker detection...');
          const dummyTranscription = await enhancedLiveTranscriptionService.processLiveTranscription(
            'Audio chunk transcriptie wordt verwerkt...',
            0.5,
            audioBlob // Audio voor speaker detection
          );
          
          if (dummyTranscription.success && dummyTranscription.transcription) {
            transcriptionId = dummyTranscription.transcription.id;
            console.log('✅ Created transcription entry with speaker detection:', {
              id: transcriptionId,
              speaker: dummyTranscription.transcription.speaker_name,
              speaker_confidence: dummyTranscription.speaker_identification?.confidence
            });
          }
        } catch (error) {
          console.warn('❌ Failed to create transcription entry:', error.message);
        }
      }

      // Process with Whisper using the correct ID (will also do speaker detection)
      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        transcriptionId,
        audioBlob
      );

      if (result.success && result.transcription) {
        const transcriptionData = {
          ...result.transcription,
          source: 'background_whisper',
          confidence: result.transcription.text_confidence || 1.0,
          database_saved: result.transcription.database_saved || false,
          // NIEUW: Speaker detection info
          speakerDetection: {
            method: result.speaker_identification?.method || 'whisper_audio',
            confidence: result.speaker_identification?.confidence || 0.0,
            identified: result.speaker_identification?.speaker_id !== 'unknown_speaker',
            improved: result.whisper_processing?.text_improved || false
          }
        };

        console.log('✅ Whisper transcription completed with speaker identification:', {
          text_preview: transcriptionData.text.substring(0, 50) + '...',
          database_saved: transcriptionData.database_saved,
          processing_status: transcriptionData.processing_status,
          transcription_id: transcriptionId,
          identified_speaker: transcriptionData.speaker_name,
          speaker_confidence: transcriptionData.speaker_confidence,
          chunk_duration: transcriptionConfig.whisper_chunk_duration + 's'
        });

        // Send improved transcription to parent
        onTranscriptionUpdate(transcriptionData);

        // Update het Whisper panel met speaker info
        if (onWhisperUpdate) {
          onWhisperUpdate({
            type: 'transcription_completed',
            transcription: transcriptionData,
            speakerDetection: transcriptionData.speakerDetection,
            message: transcriptionData.database_saved 
              ? `Whisper transcriptie opgeslagen - Spreker: ${transcriptionData.speaker_name}` 
              : `Whisper transcriptie verwerkt - Spreker: ${transcriptionData.speaker_name}`,
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

  // Show loading state while config is being loaded
  if (!configLoaded) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-6 text-center">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-600 font-medium">Configuratie laden...</span>
          </div>
        </div>
      </div>
    );
  }

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

              {/* Config warning */}
              {!transcriptionConfig.live_webspeech_enabled && !transcriptionConfig.whisper_enabled && (
                <div className="text-xs text-red-600 mt-4 p-3 bg-red-50 rounded">
                  ⚠️ Waarschuwing: Beide transcriptie methoden zijn uitgeschakeld in de configuratie.
                </div>
              )}

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
              {isRecording && !isPaused ? `Recording (${transcriptionConfig.whisper_chunk_duration}s chunks)` : 
               isPaused ? 'Gepauzeerd' : 'Gestopt'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {/* Active transcription methods indicator */}
          {transcriptionConfig.live_webspeech_enabled && (
            <span className="text-blue-600 flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>WebSpeech</span>
            </span>
          )}
          {transcriptionConfig.whisper_enabled && (
            <span className="text-purple-600 flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Whisper</span>
            </span>
          )}
          {isProcessingBackground && (
            <span className="text-green-600 flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Processing...</span>
            </span>
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

      {/* Config status warning */}
      {!transcriptionConfig.live_webspeech_enabled && !transcriptionConfig.whisper_enabled && (
        <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-700 p-3 text-sm">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>Alle transcriptie methoden zijn uitgeschakeld in de configuratie.</span>
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
                   `${transcriptionConfig.whisper_chunk_duration}s chunks actief sinds ${recordingStartTime ? recordingStartTime.toLocaleTimeString('nl-NL') : ''}`}
                </span>
              </span>
            ) : (
              'Opname gestopt'
            )}
          </div>
        </div>

        {/* Active Methods Display */}
        {isRecording && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Actieve Transcriptie Methoden:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className={`flex items-center space-x-2 p-2 rounded ${
                transcriptionConfig.live_webspeech_enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  transcriptionConfig.live_webspeech_enabled ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
                <span>🎤 Live WebSpeech</span>
                <span className="text-xs">
                  {transcriptionConfig.live_webspeech_enabled ? 'Actief' : 'Uit'}
                </span>
              </div>
              
              <div className={`flex items-center space-x-2 p-2 rounded ${
                transcriptionConfig.whisper_enabled ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  transcriptionConfig.whisper_enabled ? 'bg-purple-500' : 'bg-gray-400'
                }`}></div>
                <span>🤖 Whisper AI</span>
                <span className="text-xs">
                  {transcriptionConfig.whisper_enabled ? `${transcriptionConfig.whisper_chunk_duration}s` : 'Uit'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                (!speechSupported && transcriptionConfig.live_webspeech_enabled) ||
                (!transcriptionConfig.live_webspeech_enabled && !transcriptionConfig.whisper_enabled)
              }
            >
              🎤 Start Opname
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
        
        {/* Status messages */}
        <div className="mt-4 text-center">
          {!speechSupported && transcriptionConfig.live_webspeech_enabled && (
            <p className="text-xs text-red-600 mb-2">
              Speech recognition niet ondersteund. Gebruik Chrome of Edge.
            </p>
          )}
          
          {transcriptionConfig.live_webspeech_enabled && transcriptionConfig.whisper_enabled && (
            <p className="text-xs text-green-600">
              ✅ Dual transcriptie + speaker herkenning actief: WebSpeech (real-time) + Whisper AI ({transcriptionConfig.whisper_chunk_duration}s chunks)
            </p>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default EnhancedLiveTranscription;