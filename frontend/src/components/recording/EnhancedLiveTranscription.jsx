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
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions, interimTranscript, autoScroll]);

  // Start enhanced session
  const startEnhancedSession = async () => {
    try {
      setRecordingError('');
      
      const result = await enhancedLiveTranscriptionService.startEnhancedSession(
        meetingId,
        participants.map(p => ({
          id: p.id || `participant_${p.name}`,
          name: p.name,
          color: p.color || '#6B7280'
        }))
      );

      if (result.success) {
        setSessionActive(true);
        setSessionId(result.session_id);
        setVoiceSetupPhase(result.voice_setup_required && participants.length > 0);
        setVoiceSetupComplete(!result.voice_setup_required);
        
        if (!result.voice_setup_required) {
          startLiveTranscription();
        }
      } else {
        setRecordingError(result.error || 'Failed to start session');
      }
    } catch (error) {
      setRecordingError('Failed to start enhanced session: ' + error.message);
    }
  };

  // Voice setup process
  const startVoiceSetup = async () => {
    if (currentSetupSpeaker >= participants.length) {
      setVoiceSetupPhase(false);
      setVoiceSetupComplete(true);
      startLiveTranscription();
      return;
    }

    const speaker = participants[currentSetupSpeaker];
    setVoiceSetupError('');
    setIsRecordingVoice(true);

    try {
      console.log(`Recording voice sample for: ${speaker.name}`);
      
      const audioBlob = await enhancedLiveTranscriptionService.recordVoiceSample(5000);
      
      const result = await enhancedLiveTranscriptionService.setupVoiceProfile(
        speaker.id || `participant_${speaker.name}`,
        audioBlob
      );

      setIsRecordingVoice(false);

      if (result.success) {
        setCurrentSetupSpeaker(prev => prev + 1);
        setTimeout(() => startVoiceSetup(), 1000);
      } else {
        setVoiceSetupError(result.error || 'Voice setup failed');
      }
    } catch (error) {
      setIsRecordingVoice(false);
      setVoiceSetupError('Failed to record voice: ' + error.message);
    }
  };

  // Start live transcription
  const startLiveTranscription = async () => {
    try {
      setRecordingError('');

      // Setup speech recognition
      const speechSetup = enhancedLiveTranscriptionService.setupSpeechRecognition(
        handleSpeechResult,
        handleSpeechError
      );

      if (!speechSetup) {
        setRecordingError('Speech recognition not supported in this browser');
        return;
      }

      // Setup audio chunk processing
      enhancedLiveTranscriptionService.setChunkCallback(handleAudioChunk);

      // Start recording
      const recordingResult = await enhancedLiveTranscriptionService.startRecording();
      
      if (recordingResult.success) {
        setIsRecording(true);
      } else {
        setRecordingError(recordingResult.error);
      }
    } catch (error) {
      setRecordingError('Failed to start transcription: ' + error.message);
    }
  };

  // Handle speech recognition results
  const handleSpeechResult = async (result) => {
    const { transcript, confidence, isFinal, timestamp } = result;

    if (!isFinal) {
      setInterimTranscript(transcript);
      return;
    }

    // Clear interim transcript
    setInterimTranscript('');

    // Process final transcript
    try {
      const apiResult = await enhancedLiveTranscriptionService.processLiveTranscription(
        transcript.trim(),
        confidence
      );

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
        onTranscriptionUpdate(transcription);
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
    } else {
      setRecordingError(`Speech recognition error: ${error}`);
    }
  };

  // Handle audio chunk for Whisper processing
  const handleAudioChunk = async (audioBlob) => {
    // Find the most recent live transcription to verify
    const recentLive = recentLiveTranscriptions
      .filter(t => t.processing_status === 'live')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!recentLive) return;

    try {
      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        recentLive.id,
        audioBlob
      );

      if (result.success) {
        // Update transcription with Whisper result
        setTranscriptions(prev => prev.map(t => 
          t.id === recentLive.id ? result.transcription : t
        ));

        // Remove from recent live list
        setRecentLiveTranscriptions(prev => 
          prev.filter(t => t.id !== recentLive.id)
        );
      }
    } catch (error) {
      console.error('Failed to process Whisper verification:', error);
    }
  };

  // Stop transcription
  const stopTranscription = () => {
    enhancedLiveTranscriptionService.stopRecording();
    setIsRecording(false);
    setInterimTranscript('');
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

  // Voice setup UI
  if (voiceSetupPhase && !voiceSetupComplete) {
    const currentSpeakerData = participants[currentSetupSpeaker];
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Stem Setup - Stap {currentSetupSpeaker + 1} van {participants.length}</h3>
        
        <div className="text-center">
          {currentSpeakerData && (
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
                <div className="mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-red-600 font-medium">Opname bezig... (5 seconden)</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Spreek nu duidelijk in de microfoon
                  </div>
                </div>
              ) : (
                <button
                  onClick={startVoiceSetup}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  disabled={isRecordingVoice}
                >
                  🎤 Start Stem Opname
                </button>
              )}
            </div>
          )}
          
          {voiceSetupError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {voiceSetupError}
            </div>
          )}
          
          <div className="flex justify-center space-x-2 mt-4">
            {participants.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index < currentSetupSpeaker ? 'bg-green-500' :
                  index === currentSetupSpeaker ? 'bg-blue-500' : 'bg-gray-300'
                }`}
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
          
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-300 rounded"
            >
              ↓ Scroll naar beneden
            </button>
          )}
        </div>
      </div>

      {recordingError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {recordingError}
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
        ) : !isRecording ? (
          <button
            onClick={startLiveTranscription}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
            disabled={!voiceSetupComplete || !speechSupported}
          >
            🎤 Start Live Transcriptie
          </button>
        ) : (
          <button
            onClick={stopTranscription}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            ⏹️ Stop Transcriptie
          </button>
        )}
        
        {!speechSupported && (
          <p className="text-sm text-red-600 mt-2">
            Speech recognition wordt niet ondersteund in deze browser.
          </p>
        )}
      </div>

      {/* Transcription Display */}
      <div 
        ref={transcriptContainerRef}
        onScroll={handleScroll}
        className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto"
      >
        {transcriptions.length === 0 && !interimTranscript ? (
          <p className="text-gray-500 text-center py-8">
            {sessionActive 
              ? 'Start de transcriptie om live tekst te zien...'
              : 'Start een enhanced session om te beginnen...'
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
                <div 
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0 bg-gray-400"
                ></div>
                
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
    </div>
  );
};

export default EnhancedLiveTranscription;