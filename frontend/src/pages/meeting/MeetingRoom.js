import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService';
import transcriptionService from '../../services/api/transcriptionService';
import SimpleAudioRecorder from '../../components/recording/AudioRecorder/SimpleAudioRecorder';
import AudioUploadRecorder from '../../components/recording/AudioRecorder/AudioUploadRecorder';
import SpeakerDetection from '../../components/recording/VoiceAnalytics/SpeakerDetection';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // Transcription state
  const [transcriptions, setTranscriptions] = useState([]);

  // Speaker detection state
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false);

  // UI state
  const [showAudioUploader, setShowAudioUploader] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Refs
  const recordingIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speakers from meeting participants
  useEffect(() => {
    if (meeting?.participants?.length > 0) {
      const speakers = meeting.participants.map((participant, index) => ({
        id: `participant_${participant.id || index}`,
        name: participant.name,
        displayName: participant.name,
        role: participant.role,
        color: getSpeakerColor(index + 1),
        totalSpeakingTime: 0,
        segmentCount: 0,
        isActive: false,
        isParticipant: true
      }));

      // Add a "Unknown Speaker" option
      speakers.push({
        id: 'unknown_speaker',
        name: 'Onbekende Spreker',
        displayName: 'Onbekende Spreker', 
        role: 'unknown',
        color: '#6B7280',
        totalSpeakingTime: 0,
        segmentCount: 0,
        isActive: false,
        isParticipant: false
      });

      setAvailableSpeakers(speakers);
      
      // Initialize speaker stats
      const initialStats = {};
      speakers.forEach(speaker => {
        initialStats[speaker.id] = {
          totalTime: 0,
          segments: 0
        };
      });
      setSpeakerStats(initialStats);

      // Auto-select first participant if no speaker selected
      if (!currentSpeaker && speakers.length > 0) {
        setCurrentSpeaker(speakers[0]);
        console.log('Auto-selected first speaker:', speakers[0]);
      }
    }
  }, [meeting]);

  const getSpeakerColor = (number) => {
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red  
      '#10B981', // Green
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316'  // Orange
    ];
    return colors[(number - 1) % colors.length];
  };

  const loadTranscriptions = async () => {
    try {
      const result = await transcriptionService.getTranscriptions(id);
      if (result.success) {
        // Convert database format to frontend format
        const dbTranscriptions = result.data.map(t => ({
          id: t.id,
          text: t.text,
          timestamp: new Date(t.spoken_at),
          speaker: t.speaker_name,
          speakerId: t.speaker_id,
          speakerColor: t.speaker_color,
          confidence: parseFloat(t.confidence),
          isFinal: t.is_final
        }));
        setTranscriptions(dbTranscriptions);
        console.log('Loaded transcriptions from database:', dbTranscriptions.length);
      }
    } catch (error) {
      console.error('Failed to load transcriptions:', error);
    }
  };

  const saveTranscriptionToDatabase = async (transcription) => {
    try {
      const transcriptionData = {
        meeting_id: parseInt(id),
        speaker_name: transcription.speaker,
        speaker_id: transcription.speakerId,
        speaker_color: transcription.speakerColor,
        text: transcription.text,
        confidence: transcription.confidence,
        source: 'live',
        is_final: transcription.isFinal,
        spoken_at: transcription.timestamp.toISOString()
      };

      const result = await transcriptionService.saveTranscription(transcriptionData);
      if (result.success) {
        console.log('Transcription saved to database:', result.data.id);
        return result.data;
      } else {
        console.error('Failed to save transcription:', result.message);
      }
    } catch (error) {
      console.error('Error saving transcription:', error);
    }
  };

  // Handle transcription from audio recorder
  const handleTranscriptionReceived = async (transcription) => {
    console.log('handleTranscriptionReceived called with:', transcription);
    console.log('Current speaker when receiving transcription:', currentSpeaker);
    
    const selectedSpeaker = currentSpeaker || availableSpeakers[0];
    
    const newTranscription = {
      id: Date.now(),
      text: transcription.text,
      timestamp: transcription.timestamp,
      speaker: selectedSpeaker?.displayName || selectedSpeaker?.name || 'Audio Upload',
      speakerId: selectedSpeaker?.id || 'unknown_speaker', 
      speakerColor: selectedSpeaker?.color || '#6B7280',
      confidence: 0.9,
      isFinal: true
    };

    console.log('Adding transcription:', newTranscription);
    setTranscriptions(prev => [...prev, newTranscription]);
    
    // Save to database
    await saveTranscriptionToDatabase(newTranscription);
    
    // Update speaker stats
    if (selectedSpeaker?.id) {
      setSpeakerStats(prev => ({
        ...prev,
        [selectedSpeaker.id]: {
          totalTime: (prev[selectedSpeaker.id]?.totalTime || 0) + (transcription.duration * 1000 || 2000),
          segments: (prev[selectedSpeaker.id]?.segments || 0) + 1
        }
      }));
    }
  };

  // Handle speaker change (simplified)
  const handleSpeakerChange = (speaker) => {
    console.log('Speaker changed to:', speaker);
    setCurrentSpeaker(speaker);
  };

  // Handle voice activity from SpeakerDetection
  const handleVoiceActivity = (level) => {
    setVoiceActivityLevel(level);
    setIsDetectingSpeech(level > 25); // Threshold for speech detection
  };

  // Manual speaker selection
  const selectSpeaker = (speaker) => {
    console.log('Manually selecting speaker:', speaker);
    setCurrentSpeaker(speaker);
    
    // Mark speaker as active
    setAvailableSpeakers(prev => prev.map(s => ({
      ...s,
      isActive: s.id === speaker.id
    })));
  };

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      setupSpeechRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
      setSpeechSupported(false);
    }
  }, []);

  // Load meeting data
  useEffect(() => {
    loadMeeting();
  }, [id]);

  // Controlled scrolling - only scroll when autoScroll is enabled
  useEffect(() => {
    if (autoScroll && transcriptEndRef.current) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions, autoScroll]);

  // Monitor scroll position to disable auto-scroll when user scrolls up
  const handleScroll = () => {
    if (transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      setAutoScroll(isAtBottom);
    }
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'nl-NL'; // Dutch language
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = async (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setInterimTranscript(interimTranscript);

      // Add final transcript to transcriptions with current speaker
      if (finalTranscript.trim()) {
        console.log('Speech recognition final result');
        console.log('Current speaker at time of recognition:', currentSpeaker);
        
        // Ensure we have a valid speaker
        const selectedSpeaker = currentSpeaker || availableSpeakers.find(s => s.isParticipant) || availableSpeakers[0];
        console.log('Selected speaker for transcription:', selectedSpeaker);
        
        const newTranscription = {
          id: Date.now(),
          text: finalTranscript.trim(),
          timestamp: new Date(),
          speaker: selectedSpeaker?.displayName || selectedSpeaker?.name || 'Onbekende Spreker',
          speakerId: selectedSpeaker?.id || 'unknown_speaker',
          speakerColor: selectedSpeaker?.color || '#6B7280',
          confidence: event.results[event.results.length - 1][0].confidence || 0.8,
          isFinal: true
        };

        console.log('Adding speech recognition transcription:', newTranscription);
        setTranscriptions(prev => [...prev, newTranscription]);
        
        // Save to database
        await saveTranscriptionToDatabase(newTranscription);
        
        setCurrentTranscript('');
        
        // Update speaker stats
        if (selectedSpeaker?.id) {
          setSpeakerStats(prev => ({
            ...prev,
            [selectedSpeaker.id]: {
              totalTime: (prev[selectedSpeaker.id]?.totalTime || 0) + 1000, // Estimate 1 second per transcript
              segments: (prev[selectedSpeaker.id]?.segments || 0) + 1
            }
          }));
        }
      }
    };

    // Handle errors
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        console.log('Geen spraak gedetecteerd, probeer opnieuw...');
      } else if (event.error === 'audio-capture') {
        setError('Geen microfoon toegang. Controleer je browser instellingen.');
      } else if (event.error === 'not-allowed') {
        setError('Microfoon toegang geweigerd. Sta microfoon toegang toe.');
      } else {
        setError(`Speech recognition fout: ${event.error}`);
      }
    };

    // Handle end
    recognition.onend = () => {
      setIsListening(false);
      
      // Automatically restart if we're still recording
      if (isRecording) {
        setTimeout(() => {
          startListening();
        }, 100);
      }
    };

    // Handle start
    recognition.onstart = () => {
      setIsListening(true);
      setError(''); // Clear any previous errors
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const loadMeeting = async () => {
    try {
      const result = await meetingService.getMeeting(id);
      if (result.success) {
        setMeeting(result.data);
        // Initialize agenda start times
        const startTimes = {};
        result.data.agenda_items?.forEach((item, index) => {
          startTimes[index] = null;
        });
        setAgendaStartTimes(startTimes);
        // Load existing transcriptions
        await loadTranscriptions();
      } else {
        setError('Gesprek niet gevonden');
      }
    } catch (error) {
      setError('Fout bij laden gesprek');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      setAudioStream(stream);

      // Setup audio level monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start audio level monitoring
      monitorAudioLevel();

      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = handleAudioData;
      recorder.start(5000); // Record in 5-second chunks
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start speech recognition
      if (speechSupported) {
        console.log('Starting speech recognition with current speaker:', currentSpeaker);
        startListening();
      }

      // Mark current agenda item as started
      if (meeting?.agenda_items?.[currentAgendaIndex]) {
        setAgendaStartTimes(prev => ({
          ...prev,
          [currentAgendaIndex]: new Date()
        }));
      }

      // Start meeting if not already started
      if (meeting?.status === 'scheduled') {
        await meetingService.startMeeting(id);
        setMeeting(prev => ({ ...prev, status: 'active' }));
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Kon opname niet starten. Controleer microfoon toegang.');
    }
  };

  const stopRecording = () => {
    // Stop speech recognition
    stopListening();

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setIsRecording(false);
    setAudioLevel(0);
    setMediaRecorder(null);
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const handleAudioData = async (event) => {
    if (event.data.size > 0) {
      // Audio data wordt opgenomen - in de toekomst kunnen we dit naar Azure Whisper sturen
      // Voor nu gebruiken we de Web Speech API voor live transcriptie
      console.log('Audio chunk recorded:', event.data.size, 'bytes');
    }
  };

  const nextAgendaItem = () => {
    if (currentAgendaIndex < (meeting?.agenda_items?.length || 0) - 1) {
      const newIndex = currentAgendaIndex + 1;
      setCurrentAgendaIndex(newIndex);
      setAgendaStartTimes(prev => ({
        ...prev,
        [newIndex]: new Date()
      }));
    }
  };

  const previousAgendaItem = () => {
    if (currentAgendaIndex > 0) {
      setCurrentAgendaIndex(currentAgendaIndex - 1);
    }
  };

  const finishMeeting = async () => {
    stopRecording();
    
    try {
      await meetingService.stopMeeting(id);
      navigate('/dashboard');
    } catch (error) {
      setError('Fout bij afsluiten gesprek');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeakingTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-conversation-muted">Gesprek laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="conversation-button">
          Terug naar Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Recording Controls */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{meeting?.title}</h1>
            <p className="text-gray-600 mt-1">{meeting?.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                meeting?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {meeting?.status === 'active' ? 'Actief' : 'Inactief'}
              </span>
              <span className="text-sm text-gray-500">
                {meeting?.participants?.length || 0} deelnemers
              </span>
              <span className={`text-xs ${isListening ? 'text-green-600' : 'text-gray-500'}`}>
                {isListening ? 'Live transcriptie actief' : 'Live transcriptie gestopt'}
              </span>
              {currentSpeaker && (
                <span className="text-xs text-blue-600">
                  Geselecteerde spreker: {currentSpeaker.displayName}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Recording Controls in Header */}
            <div className="flex items-center space-x-3">
              {/* Audio Level Indicator */}
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${(audioLevel / 255) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono text-gray-900">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {/* Main Recording Button */}
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2"
                >
                  <span>🎤</span>
                  <span>Start Opname & Transcriptie</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-medium animate-pulse flex items-center space-x-2"
                >
                  <span>⏹️</span>
                  <span>Stop Opname & Transcriptie</span>
                </button>
              )}
            </div>

            <div className="flex space-x-3 border-l pl-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Sluiten
              </button>
              <button 
                onClick={finishMeeting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Gesprek Beëindigen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Voice Activity Monitor + Live Transcription on left, Sidebar on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Voice Activity + Live Transcription */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Activity Monitor */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Voice Activity Monitor</h2>
            
            <div className="space-y-3">
              {/* Voice Activity Display */}
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isDetectingSpeech ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm">
                  {isDetectingSpeech ? 'Spraak gedetecteerd' : 'Luistert...'}
                </span>
              </div>

              {/* Voice Level Bar */}
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min((voiceActivityLevel / 80) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Geluidsniveau: {Math.round(voiceActivityLevel)}
                </div>
              </div>
            </div>
          </div>

          {/* Live Transcription */}
          <div className="conversation-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Live Transcriptie</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isListening ? 'Live transcriptie actief' : 'Live transcriptie gestopt'}
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
            
            <div 
              ref={transcriptContainerRef}
              onScroll={handleScroll}
              className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto"
            >
              {transcriptions.length === 0 && !interimTranscript ? (
                <p className="text-gray-500 text-center py-8">
                  {speechSupported 
                    ? 'Start de opname om live transcriptie te zien. Zorg dat je microfoon toegang toestaat.'
                    : 'Live transcriptie niet beschikbaar in deze browser.'
                  }
                </p>
              ) : (
                <div className="space-y-2">
                  {transcriptions.map((transcript) => (
                    <div key={transcript.id} className="flex items-start space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: transcript.speakerColor }}
                        title={transcript.speaker}
                      ></div>
                      <div className="flex-1">
                        <div className="text-gray-900 leading-relaxed">
                          {transcript.text}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {transcript.timestamp.toLocaleTimeString('nl-NL', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })} • {Math.round((transcript.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show interim results in real-time */}
                  {interimTranscript && (
                    <div className="flex items-start space-x-2 opacity-60">
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: currentSpeaker?.color || '#6B7280' }}
                        title={currentSpeaker?.displayName || 'Onbekende Spreker'}
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





          {/* Audio Upload Recorder - Collapsible */}
          <div className="conversation-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Audio Upload Transcriptie</h3>
              <button
                onClick={() => setShowAudioUploader(!showAudioUploader)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAudioUploader ? 'Verbergen' : 'Tonen'}
              </button>
            </div>
            
            {showAudioUploader && (
              <AudioUploadRecorder 
                onTranscriptionReceived={handleTranscriptionReceived}
                meetingId={id}
                disabled={false}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Speaker Selection Panel */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Huidige Spreker</h2>
            
            {/* Current Speaker Display */}
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentSpeaker?.color || '#E5E7EB' }}
                ></div>
                <span className="font-medium">
                  {currentSpeaker ? currentSpeaker.displayName : 'Selecteer spreker'}
                </span>
              </div>
              
              {/* Voice Level */}
              {isRecording && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-200"
                      style={{ width: `${Math.min((voiceActivityLevel / 80) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Geluid: {Math.round(voiceActivityLevel)}
                  </div>
                </div>
              )}
            </div>

            {/* Speaker Selection Buttons */}
            <div className="space-y-2">

<h4 className="font-medium text-sm text-gray-700">Selecteer spreker:</h4>
             {availableSpeakers.map((speaker) => (
               <button
                 key={speaker.id}
                 onClick={() => selectSpeaker(speaker)}
                 className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-colors ${
                   currentSpeaker?.id === speaker.id 
                     ? 'border-blue-500 bg-blue-50' 
                     : 'border-gray-200 hover:bg-gray-50'
                 }`}
               >
                 <div className="flex items-center space-x-3">
                   <div 
                     className="w-3 h-3 rounded-full"
                     style={{ backgroundColor: speaker.color }}
                   ></div>
                   <div>
                     <div className="font-medium text-sm">{speaker.displayName}</div>
                     {speaker.isParticipant && (
                       <div className="text-xs text-gray-500">{speaker.role}</div>
                     )}
                   </div>
                 </div>
                 
                 <div className="text-xs text-gray-500">
                   {formatSpeakingTime(speakerStats[speaker.id]?.totalTime || 0)}
                 </div>
               </button>
             ))}
           </div>
         </div>

         {/* Agenda Tracking */}
         <div className="conversation-card">
           <h2 className="text-lg font-medium mb-4">Agenda Voortgang</h2>
           
           {meeting?.agenda_items?.length > 0 ? (
             <div className="space-y-3">
               {meeting.agenda_items.map((item, index) => (
                 <div 
                   key={item.id || index}
                   className={`p-3 rounded border ${
                     index === currentAgendaIndex 
                       ? 'border-primary-500 bg-primary-50' 
                       : index < currentAgendaIndex
                       ? 'border-green-500 bg-green-50'
                       : 'border-gray-200'
                   }`}
                 >
                   <div className="flex items-center justify-between">
                     <h3 className="font-medium text-sm">{item.title}</h3>
                     <span className="text-xs text-gray-500">
                       {agendaStartTimes[index] && (
                         agendaStartTimes[index].toLocaleTimeString('nl-NL', { 
                           hour: '2-digit', 
                           minute: '2-digit' 
                         })
                       )}
                     </span>
                   </div>
                   {item.description && (
                     <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                   )}
                 </div>
               ))}

               {/* Agenda Navigation */}
               <div className="flex space-x-2 mt-4">
                 <button
                   onClick={previousAgendaItem}
                   disabled={currentAgendaIndex === 0}
                   className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                 >
                   ← Vorige
                 </button>
                 <button
                   onClick={nextAgendaItem}
                   disabled={currentAgendaIndex >= (meeting?.agenda_items?.length || 0) - 1}
                   className="flex-1 px-3 py-2 text-sm bg-primary-100 hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                 >
                   Volgende →
                 </button>
               </div>
             </div>
           ) : (
             <p className="text-gray-500 text-sm">Geen agenda items</p>
           )}
         </div>

         {/* Meeting Participants */}
         <div className="conversation-card">
           <h2 className="text-lg font-medium mb-4">Deelnemers Status</h2>
           
           {meeting?.participants?.length > 0 ? (
             <div className="space-y-2">
               {meeting.participants.map((participant, index) => {
                 const speaker = availableSpeakers.find(s => s.name === participant.name);
                 const speakingTime = speakerStats[speaker?.id]?.totalTime || 0;
                 const isCurrentSpeaker = currentSpeaker?.name === participant.name;

                 return (
                   <div key={participant.id || index} className="flex items-center justify-between p-2 border rounded">
                     <div className="flex items-center space-x-2">
                       <div 
                         className={`w-3 h-3 rounded-full ${isCurrentSpeaker ? 'animate-pulse' : ''}`}
                         style={{ backgroundColor: speaker?.color || '#10B981' }}
                         title={isCurrentSpeaker ? 'Spreekt nu' : 'Aanwezig'}
                       ></div>
                       <div>
                         <div className="font-medium text-sm">{participant.name}</div>
                         <div className="text-xs text-gray-500">{participant.role}</div>
                       </div>
                     </div>
                     <div className="text-xs text-gray-500">
                       {formatSpeakingTime(speakingTime)}
                     </div>
                   </div>
                 );
               })}
             </div>
           ) : (
             <p className="text-gray-500 text-sm">Geen deelnemers</p>
           )}

           {/* Speaking Time Summary */}
           {Object.values(speakerStats).some(stat => stat.totalTime > 0) && (
             <div className="mt-4 pt-3 border-t">
               <h4 className="font-medium text-sm mb-2">Spreektijd Verdeling:</h4>
               <div className="space-y-1">
                 {availableSpeakers
                   .filter(speaker => speakerStats[speaker.id]?.totalTime > 0)
                   .sort((a, b) => (speakerStats[b.id]?.totalTime || 0) - (speakerStats[a.id]?.totalTime || 0))
                   .map((speaker) => {
                     const totalTime = Object.values(speakerStats).reduce((sum, stat) => sum + (stat.totalTime || 0), 0);
                     const speakerTime = speakerStats[speaker.id]?.totalTime || 0;
                     const percentage = totalTime > 0 ? (speakerTime / totalTime) * 100 : 0;
                     
                     return (
                       <div key={speaker.id} className="flex items-center space-x-2">
                         <div 
                           className="w-2 h-2 rounded-full"
                           style={{ backgroundColor: speaker.color }}
                         ></div>
                         <span className="text-xs flex-1">{speaker.displayName}</span>
                         <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
                       </div>
                     );
                   })}
               </div>
             </div>
           )}
         </div>
       </div>
     </div>

     {/* Hidden SpeakerDetection component to handle voice activity */}
     <div style={{ display: 'none' }}>
       <SpeakerDetection 
         isRecording={isRecording}
         audioStream={audioStream}
         onVoiceActivity={handleVoiceActivity}
       />
     </div>
   </div>
 );
};

export default MeetingRoom;

