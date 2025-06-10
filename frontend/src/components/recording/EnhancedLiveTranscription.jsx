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
  const [liveTranscriptions, setLiveTranscriptions] = useState([]);
  const [whisperTranscriptions, setWhisperTranscriptions] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [pendingLiveTranscriptions, setPendingLiveTranscriptions] = useState([]);

  // Processing state
  const [whisperProcessingQueue, setWhisperProcessingQueue] = useState([]);
  const [isProcessingWhisper, setIsProcessingWhisper] = useState(false);

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

  // Handle speech recognition results
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
        
        console.log('✅ Live transcription added:', {
          id: transcription.id,
          text: transcription.text.substring(0, 50) + '...'
        });
        
        // Add to live panel
        setLiveTranscriptions(prev => [...prev, {
          ...transcription,
          panel: 'live',
          original_confidence: confidence
        }]);
        
        // Add to pending queue for Whisper processing
        setPendingLiveTranscriptions(prev => [...prev, transcription]);
        
        // Update session stats
        if (apiResult.session_stats) {
          setSessionStats(apiResult.session_stats);
          onSessionStatsUpdate(apiResult.session_stats);
        }

        // Call parent callback
        onTranscriptionUpdate(apiResult.transcription);
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

  // Handle audio chunk for Whisper processing - FIXED
  const handleAudioChunk = async (audioBlob) => {
    console.log('🎵 Audio chunk received for Whisper:', {
      size: audioBlob.size,
      type: audioBlob.type,
      pending_transcriptions: pendingLiveTranscriptions.length,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Find the most recent pending live transcription
    const recentLive = pendingLiveTranscriptions
      .filter(t => t.processing_status === 'live')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!recentLive) {
      console.log('⚠️ No pending live transcription for Whisper verification');
      return;
    }

    console.log('🔍 Processing Whisper verification for:', {
      id: recentLive.id,
      text: recentLive.text.substring(0, 50) + '...'
    });

    setIsProcessingWhisper(true);

    try {
      const result = await enhancedLiveTranscriptionService.processWhisperVerification(
        recentLive.id,
        audioBlob
      );

      console.log('🤖 Whisper result:', {
        success: result.success,
        has_transcription: !!result.transcription,
        whisper_text: result.transcription?.text?.substring(0, 50) + '...'
      });

      if (result.success && result.transcription) {
        console.log('✅ Adding to Whisper panel');

        // Add to Whisper panel
        setWhisperTranscriptions(prev => [...prev, {
          ...result.transcription,
          panel: 'whisper',
          original_live_text: recentLive.text,
          improved: recentLive.text.trim() !== result.transcription.text.trim(),
          chunk_processed_at: new Date().toISOString()
        }]);

        // Remove from pending queue
        setPendingLiveTranscriptions(prev => 
          prev.filter(t => t.id !== recentLive.id)
        );

        // Call parent callback with Whisper result
        onTranscriptionUpdate({
          ...result.transcription,
          source: 'whisper_verified',
          original_live_text: recentLive.text
        });
      } else {
        console.warn('⚠️ Whisper verification failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Whisper processing error:', error);
    } finally {
      setIsProcessingWhisper(false);
    }
  };

  // Stop transcription
  const stopTranscription = () => {
    try {
      enhancedLiveTranscriptionService.stopRecording();
      setInterimTranscript('');
      setIsRecording(false);
      setIsProcessingWhisper(false);
      setPendingLiveTranscriptions([]);
      console.log('✅ Transcription stopped');
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

 // Main UI: Side-by-side transcription panels
 return (
   <div className="bg-white rounded-lg border">
     {/* Header */}
     <div className="flex justify-between items-center p-4 border-b">
       <div className="flex items-center space-x-3">
         <h3 className="font-medium">🎤 Enhanced Live Transcriptie</h3>
         <div className="flex items-center space-x-2 text-sm">
           <div className={`w-2 h-2 rounded-full ${
             isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
           }`}></div>
           <span className="text-gray-600">
             {isRecording ? 'Live Recording' : 'Gestopt'}
           </span>
         </div>
       </div>
       
       <div className="flex items-center space-x-2">
         {isProcessingWhisper && (
           <div className="flex items-center space-x-1 text-xs text-blue-600">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
             <span>Whisper Processing...</span>
           </div>
         )}
         <div className="text-xs text-gray-500">
           Live: {liveTranscriptions.length} | Whisper: {whisperTranscriptions.length} | Queue: {pendingLiveTranscriptions.length}
         </div>
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

     {/* Side-by-side transcription panels */}
     <div className="grid grid-cols-2 gap-4 p-4">
       
       {/* LEFT: Web Speech API (Live) */}
       <div className="border rounded-lg">
         <div className="bg-blue-50 px-3 py-2 border-b">
           <h4 className="font-medium text-blue-800 text-sm flex items-center space-x-2">
             <span>🎤</span>
             <span>Web Speech API (Live)</span>
             <span className="text-xs bg-blue-200 px-2 py-1 rounded">{liveTranscriptions.length}</span>
             {pendingLiveTranscriptions.length > 0 && (
               <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded">
                 {pendingLiveTranscriptions.length} pending
               </span>
             )}
           </h4>
         </div>
         
         <div className="h-64 overflow-y-auto p-3">
           {liveTranscriptions.length === 0 && !interimTranscript ? (
             <div className="text-center py-8 text-gray-500">
               <div className="text-2xl mb-2">🎤</div>
               <p className="text-sm">Live Web Speech results verschijnen hier</p>
               <p className="text-xs text-gray-400 mt-1">Real-time browser speech recognition</p>
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
                     <span className="text-xs text-gray-500">
                       #{transcription.chunk_number || '?'}
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

       {/* RIGHT: Azure Whisper (Verified) */}
       <div className="border rounded-lg">
         <div className="bg-green-50 px-3 py-2 border-b">
           <h4 className="font-medium text-green-800 text-sm flex items-center space-x-2">
             <span>🤖</span>
             <span>Azure Whisper (Verified)</span>
             <span className="text-xs bg-green-200 px-2 py-1 rounded">{whisperTranscriptions.length}</span>
             {isProcessingWhisper && (
               <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-1 rounded animate-pulse">
                 Processing...
               </span>
             )}
           </h4>
         </div>
         
         <div className="h-64 overflow-y-auto p-3">
           {whisperTranscriptions.length === 0 ? (
             <div className="text-center py-8 text-gray-500">
               <div className="text-2xl mb-2">🤖</div>
               <p className="text-sm">Whisper verified results verschijnen hier</p>
               <p className="text-xs text-gray-400 mt-1">Azure OpenAI Whisper transcriptie iedere 30 seconden</p>
               {isProcessingWhisper && (
                 <div className="mt-3 text-xs text-blue-600">
                   <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-1"></div>
                   Whisper aan het verwerken...
                 </div>
               )}
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
                   
                   {/* Show comparison if improved */}
                   {transcription.improved && transcription.original_live_text && (
                     <div className="text-xs text-gray-600 mt-1 p-1 bg-gray-100 rounded">
                       <span className="font-medium">Was:</span> {transcription.original_live_text}
                     </div>
                   )}
                   
                   <div className="text-xs text-green-600 mt-1 flex justify-between">
                     <span>
                       {new Date(transcription.chunk_processed_at || transcription.timestamp).toLocaleTimeString('nl-NL', {
                         hour: '2-digit', minute: '2-digit', second: '2-digit'
                       })}
                     </span>
                     <span className="text-gray-500">
                       Chunk #{transcription.chunk_number || '?'}
                     </span>
                   </div>
                 </div>
               ))}
               
               <div ref={whisperTranscriptEndRef} />
             </div>
           )}
         </div>
       </div>
     </div>

     {/* Debug Footer */}
     {isRecording && (
       <div className="p-2 bg-gray-100 border-t text-xs text-gray-500 flex justify-between">
         <span>🎤 Recording Active</span>
         <span>
           Live: {liveTranscriptions.length} | 
           Whisper: {whisperTranscriptions.length} | 
           Pending: {pendingLiveTranscriptions.length}
         </span>
         <span>{sessionId ? `Session: ${sessionId.substring(0, 8)}...` : 'No Session'}</span>
       </div>
     )}
   </div>
 );
};

export default EnhancedLiveTranscription;

