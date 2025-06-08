import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import EnhancedLiveTranscription from '../../components/recording/EnhancedLiveTranscription.jsx';
import AudioUploadRecorder from '../../components/recording/AudioRecorder/AudioUploadRecorder.jsx';


const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transcription state
  const [transcriptions, setTranscriptions] = useState([]);

  // Speaker detection state
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // UI state
  const [showAudioUploader, setShowAudioUploader] = useState(false);

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Refs for backward compatibility
  const transcriptEndRef = useRef(null);

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
          isFinal: t.is_final,
          processingStatus: 'verified' // Database transcriptions are always verified
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
        source: 'enhanced_live',
        is_final: transcription.isFinal || true,
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

  // Load meeting data
  useEffect(() => {
    loadMeeting();
  }, [id]);

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

// MAYO SECTIE 1 EINDE - PART 1 OF 4
// MAYO SECTIE 2 VERVOLG - PART 2 OF 4

  // Enhanced transcription handlers
  const handleEnhancedTranscriptionUpdate = (transcription) => {
    console.log('Enhanced transcription received:', transcription);
    
    // Update transcriptions state for compatibility
    setTranscriptions(prev => [...prev, {
      id: transcription.id,
      text: transcription.text,
      timestamp: new Date(transcription.timestamp),
      speaker: transcription.speaker_name,
      speakerId: transcription.speaker_id,
      speakerColor: transcription.speaker_color,
      confidence: transcription.text_confidence,
      isFinal: transcription.processing_status === 'verified',
      processingStatus: transcription.processing_status
    }]);

    // Update speaker stats
    if (transcription.speaker_id && transcription.speaker_id !== 'unknown_speaker') {
      setSpeakerStats(prev => ({
        ...prev,
        [transcription.speaker_id]: {
          totalTime: (prev[transcription.speaker_id]?.totalTime || 0) + 2000, // Estimate 2 seconds
          segments: (prev[transcription.speaker_id]?.segments || 0) + 1
        }
      }));
    }

    // Save verified transcriptions to database
    if (transcription.processing_status === 'verified') {
      saveTranscriptionToDatabase({
        speaker: transcription.speaker_name,
        speakerId: transcription.speaker_id,
        speakerColor: transcription.speaker_color,
        text: transcription.text,
        confidence: transcription.text_confidence,
        timestamp: new Date(transcription.timestamp),
        isFinal: true
      });
    }
  };

  const handleSessionStatsUpdate = (stats) => {
    console.log('Session stats updated:', stats);
    // You can use these stats to show progress, cost estimation, etc.
    // For example: update UI with verification rate, cost estimates, etc.
  };

  // Legacy transcription handler (for backward compatibility with AudioUploadRecorder)
  const handleLegacyTranscriptionReceived = async (transcription) => {
    console.log('Legacy transcription received:', transcription);
    
    const selectedSpeaker = currentSpeaker || availableSpeakers[0];
    
    const newTranscription = {
      id: Date.now(),
      text: transcription.text,
      timestamp: transcription.timestamp,
      speaker: selectedSpeaker?.displayName || selectedSpeaker?.name || 'Audio Upload',
      speakerId: selectedSpeaker?.id || 'unknown_speaker', 
      speakerColor: selectedSpeaker?.color || '#6B7280',
      confidence: 0.9,
      isFinal: true,
      processingStatus: 'verified'
    };

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

  // Speaker selection functions
  const handleSpeakerChange = (speaker) => {
    console.log('Speaker changed to:', speaker);
    setCurrentSpeaker(speaker);
  };

  const selectSpeaker = (speaker) => {
    console.log('Manually selecting speaker:', speaker);
    setCurrentSpeaker(speaker);
    
    // Mark speaker as active
    setAvailableSpeakers(prev => prev.map(s => ({
      ...s,
      isActive: s.id === speaker.id
    })));
  };

  // Agenda navigation functions
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

  // Meeting control functions
  const finishMeeting = async () => {
    try {
      await meetingService.stopMeeting(id);
      navigate('/dashboard');
    } catch (error) {
      setError('Fout bij afsluiten gesprek');
    }
  };

  // Utility functions
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
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Loading and error states
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

// MAYO SECTIE 2 EINDE - PART 2 OF 4

// MAYO SECTIE 3 VERVOLG - PART 3 OF 4

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Meeting Info */}
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
              <span className="text-xs text-blue-600">
                Enhanced Live Transcriptie Beschikbaar
              </span>
              {currentSpeaker && (
                <span className="text-xs text-purple-600">
                  Geselecteerde spreker: {currentSpeaker.displayName}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Meeting Status Display */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                Enhanced Transcriptie Klaar
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-600">Meeting Room</span>
              </div>
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

      {/* Main Layout: Enhanced Transcription + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Enhanced Live Transcription */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Overview */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Enhanced Transcriptie Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm font-medium">Enhanced Live Transcriptie</span>
                <span className="text-xs text-blue-600">Actief met voice recognition</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-sm font-medium">Azure Whisper Verificatie</span>
                <span className="text-xs text-green-600">30-seconde chunks</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <span className="text-sm font-medium">Automatische Speaker Detectie</span>
                <span className="text-xs text-purple-600">Voice fingerprinting</span>
              </div>
            </div>
          </div>

          {/* Enhanced Live Transcription Component */}
          <EnhancedLiveTranscription
            meetingId={id}
            participants={availableSpeakers.filter(s => s.isParticipant)}
            onTranscriptionUpdate={handleEnhancedTranscriptionUpdate}
            onSessionStatsUpdate={handleSessionStatsUpdate}
          />

          {/* Audio Upload Recorder - Backup Option */}
          <div className="conversation-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Audio Upload Transcriptie (Backup)</h3>
              <button
                onClick={() => setShowAudioUploader(!showAudioUploader)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAudioUploader ? 'Verbergen' : 'Tonen'}
              </button>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              💡 Let op: Gebruik de Enhanced Live Transcriptie hierboven voor de beste ervaring
            </div>
            
            {showAudioUploader && (
              <AudioUploadRecorder 
                onTranscriptionReceived={handleLegacyTranscriptionReceived}
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

// MAYO SECTIE 3 EINDE - PART 3 OF 4

// MAYO SECTIE 4 VERVOLG - PART 4 OF 4 (FINAL)

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

          {/* Meeting Participants Status */}
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

          {/* Enhanced Transcription Info */}
          <div className="conversation-card">
            <h2 className="text-lg font-medium mb-4">Enhanced Transcriptie Info</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-600">Live</span>
                <span className="text-gray-500">- Direct van Web Speech API</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-spin"></div>
                <span className="text-yellow-600">Verwerken</span>
                <span className="text-gray-500">- Azure Whisper bezig</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Geverifieerd</span>
                <span className="text-gray-500">- Definitieve versie</span>
              </div>
              
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                💡 Het systeem combineert directe feedback met hoge kwaliteit verificatie voor de beste ervaring.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcription History (for reference, scrollable to from Enhanced component) */}
      <div style={{ display: 'none' }}>
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};

export default MeetingRoom;

// MAYO SECTIE 4 EINDE - PART 4 OF 4 (COMPLETE FILE)
