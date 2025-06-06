import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService';
import SimpleAudioRecorder from '../../components/recording/AudioRecorder/SimpleAudioRecorder';
import AudioUploadRecorder from '../../components/recording/AudioRecorder/AudioUploadRecorder';


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

  // Handle transcription from audio recorder
  const handleTranscriptionReceived = (transcription) => {
    const newTranscription = {
      id: Date.now(),
      text: transcription.text,
      timestamp: transcription.timestamp,
      speaker: transcription.speaker || 'Audio Opname',
      confidence: 0.9, // Azure Whisper is usually high confidence
      isFinal: true
    };

    setTranscriptions(prev => [...prev, newTranscription]);
  };

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Refs
  const recordingIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const recognitionRef = useRef(null);

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

  // Scroll to bottom when new transcription arrives
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions, currentTranscript, interimTranscript]);

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'nl-NL'; // Dutch language
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event) => {
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

      // Add final transcript to transcriptions
      if (finalTranscript.trim()) {
        const newTranscription = {
          id: Date.now(),
          text: finalTranscript.trim(),
          timestamp: new Date(),
          speaker: 'Spreker',
          confidence: event.results[event.results.length - 1][0].confidence || 0.8,
          isFinal: true
        };

        setTranscriptions(prev => [...prev, newTranscription]);
        setCurrentTranscript('');
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

    if (audioContextRef.current) {
      audioContextRef.current.close();
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

  const currentAgendaItem = meeting?.agenda_items?.[currentAgendaIndex];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
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
              {speechSupported ? (
                <span className="text-xs text-green-600">🎤 Live transcriptie beschikbaar</span>
              ) : (
                <span className="text-xs text-orange-600">⚠️ Live transcriptie niet ondersteund</span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audio Recording Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recording Controls */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Audio Opname & Live Transcriptie</h2>
            
            <div className="text-center space-y-4">
              {/* Speech Recognition Status */}
              {speechSupported && (
                <div className="flex justify-center items-center space-x-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isListening ? 'Live transcriptie actief' : 'Live transcriptie gestopt'}
                  </span>
                </div>
              )}

              {/* Audio Level Indicator */}
              <div className="flex justify-center items-center space-x-2">
                <div className="w-64 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full transition-all duration-100"
                    style={{ width: `${(audioLevel / 255) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">{Math.round((audioLevel / 255) * 100)}%</span>
              </div>

              {/* Recording Timer */}
              <div className="text-3xl font-mono text-gray-900">
                {formatTime(recordingTime)}
              </div>

              {/* Recording Button */}
              <div>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-medium"
                  >
                    🎤 Start Opname & Transcriptie
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-full text-lg font-medium animate-pulse"
                  >
                    ⏹️ Stop Opname & Transcriptie
                  </button>
                )}
              </div>

              {!speechSupported && (
                <p className="text-sm text-orange-600 mt-2">
                  Live transcriptie wordt niet ondersteund in deze browser. 
                  Probeer Chrome, Edge of Safari voor de beste ervaring.
                </p>
              )}
            </div>
          </div>

{/* Audio Recorder */}
         {/* Audio Upload Recorder */}
          <AudioUploadRecorder 
            onTranscriptionReceived={handleTranscriptionReceived}
            meetingId={id}
            disabled={false}
          />

          {/* Live Transcription */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Live Transcriptie</h2>


            
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              {transcriptions.length === 0 && !interimTranscript ? (
                <p className="text-gray-500 text-center py-8">
                  {speechSupported 
                    ? 'Start de opname om live transcriptie te zien. Zorg dat je microfoon toegang toestaat.'
                    : 'Live transcriptie niet beschikbaar in deze browser.'
                  }
                </p>
              ) : (
                <div className="space-y-3">
                  {transcriptions.map((transcript) => (
                    <div key={transcript.id} className="flex space-x-3">
                      <div className="text-xs text-gray-500 w-16 flex-shrink-0">
                        {transcript.timestamp.toLocaleTimeString('nl-NL', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
                          <span>{transcript.speaker}</span>
                          <span className="text-xs text-gray-400">
                            ({Math.round((transcript.confidence || 0) * 100)}% zekerheid)
                          </span>
                        </div>
                        <div className="text-gray-900">{transcript.text}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show interim results in real-time */}
                  {interimTranscript && (
                    <div className="flex space-x-3 opacity-60">
                      <div className="text-xs text-gray-500 w-16 flex-shrink-0">
                        {new Date().toLocaleTimeString('nl-NL', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Spreker (aan het typen...)
                        </div>
                        <div className="text-gray-600 italic">{interimTranscript}</div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Participants Status */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Deelnemers</h2>
            
            {meeting?.participants?.length > 0 ? (
              <div className="space-y-2">
                {meeting.participants.map((participant, index) => (
                  <div key={participant.id || index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{participant.name}</div>
                      <div className="text-xs text-gray-500">{participant.role}</div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Aanwezig"></div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Geen deelnemers</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;