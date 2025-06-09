import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import EnhancedLiveTranscription from '../../components/recording/EnhancedLiveTranscription.jsx';
import BasicAudioUploader from '../../components/recording/AudioRecorder/BasicAudioUploader.jsx';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor, formatSpeakingTime, formatTimestamp } from './utils/meetingUtils.js';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transcription state - ALLE TRANSCRIPTIES BLIJVEN BEHOUDEN
  const [transcriptions, setTranscriptions] = useState([]);

  // Speaker state
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // UI state - welke sectie is open
  const [expandedSections, setExpandedSections] = useState({
    basicAudio: true,
    enhancedLive: false,
    transcriptionHistory: true
  });

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Initialize speakers
  useEffect(() => {
    if (meeting?.participants?.length > 0) {
      const speakers = meeting.participants.map((participant, index) => ({
        id: `participant_${participant.id || index}`,
        name: participant.name,
        displayName: participant.name,
        role: participant.role,
        color: getSpeakerColor(index + 1),
        isActive: false,
        isParticipant: true
      }));

      speakers.push({
        id: 'unknown_speaker',
        name: 'Onbekende Spreker',
        displayName: 'Onbekende Spreker',
        role: 'unknown',
        color: '#6B7280',
        isActive: false,
        isParticipant: false
      });

      setAvailableSpeakers(speakers);
      
      const initialStats = {};
      speakers.forEach(speaker => {
        initialStats[speaker.id] = { totalTime: 0, segments: 0 };
      });
      setSpeakerStats(initialStats);

      if (!currentSpeaker && speakers.length > 0) {
        setCurrentSpeaker(speakers[0]);
      }
    }
  }, [meeting]);

  // Load meeting
  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      console.log('Loading meeting with ID:', id); // Debug log
      const result = await meetingService.getMeeting(id);
      if (result.success) {
        setMeeting(result.data);
        console.log('Meeting loaded:', result.data); // Debug log
        const startTimes = {};
        result.data.agenda_items?.forEach((item, index) => {
          startTimes[index] = null;
        });
        setAgendaStartTimes(startTimes);
        await loadTranscriptions();
      } else {
        setError('Gesprek niet gevonden');
      }
    } catch (error) {
      setError('Fout bij laden gesprek');
      console.error('Meeting load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTranscriptions = async () => {
    try {
      const result = await transcriptionService.getTranscriptions(id);
      if (result.success) {
        const dbTranscriptions = result.data.map(t => ({
          id: t.id,
          text: t.text,
          timestamp: new Date(t.spoken_at),
          speaker: t.speaker_name,
          speakerId: t.speaker_id,
          speakerColor: t.speaker_color,
          confidence: parseFloat(t.confidence),
          isFinal: t.is_final,
          processingStatus: 'verified',
          source: 'database'
        }));
        setTranscriptions(dbTranscriptions);
      }
    } catch (error) {
      console.error('Failed to load transcriptions:', error);
    }
  };

  // Get handlers
  const handlers = useMeetingHandlers({
    id,
    transcriptions,
    setTranscriptions,
    currentSpeaker,
    setCurrentSpeaker,
    availableSpeakers,
    setAvailableSpeakers,
    speakerStats,
    setSpeakerStats,
    currentAgendaIndex,
    setCurrentAgendaIndex,
    agendaStartTimes,
    setAgendaStartTimes,
    meeting
  });

  // Handle transcription from any source
  const handleTranscriptionUpdate = (transcriptionData) => {
    console.log('📝 New transcription received:', transcriptionData);
    
    // Call the handler to save to database and update main list
    handlers.handleTranscriptionReceived(transcriptionData);
  };

  // Toggle expanded sections
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Meeting controls
  const finishMeeting = async () => {
    try {
      await meetingService.stopMeeting(id);
      navigate('/dashboard');
    } catch (error) {
      setError('Fout bij afsluiten gesprek');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">❌</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Fout</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm px-4 py-2">
          Terug
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="modern-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h1 className="text-xl font-bold text-gray-900">{meeting?.title}</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🆔 Meeting ID: {id}</span>
              <span>👥 {meeting?.participants?.length || 0} deelnemers</span>
              <span>📝 {transcriptions.length} transcripties</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => navigate('/dashboard')} className="btn-neutral text-sm px-3 py-1">
              🏠 Dashboard
            </button>
            <button onClick={finishMeeting} className="btn-danger text-sm px-3 py-1">
              ⏹️ Stop Meeting
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content - Verschillende Transcriptie Opties */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* 1. Basis Audio Upload - Handmatige Opname */}
          <div className="modern-card">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer border-b"
              onClick={() => toggleSection('basicAudio')}
            >
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <span>🎤</span>
                <span>Handmatige Audio Opname</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Opnemen → Stop → Transcribeer</span>
                <span className="text-gray-400">
                  {expandedSections.basicAudio ? '▲' : '▼'}
                </span>
              </div>
            </div>
            
            {expandedSections.basicAudio && (
              <div className="p-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Handmatige Mode:</strong> Neem audio op, stop wanneer je wilt, en klik dan op transcribeer om de tekst te krijgen.
                  </p>
                </div>

                <BasicAudioUploader
                  onTranscriptionReceived={handleTranscriptionUpdate}
                  meetingId={parseInt(id)} // Zorg ervoor dat het een number is
                  disabled={false}
                />
              </div>
            )}
          </div>

          {/* 2. Enhanced Live Transcription - Real-time */}
          <div className="modern-card">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer border-b"
              onClick={() => toggleSection('enhancedLive')}
            >
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <span>🎯</span>
                <span>Enhanced Live Transcriptie</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Real-time spraak naar tekst</span>
                <span className="text-gray-400">
                  {expandedSections.enhancedLive ? '▲' : '▼'}
                </span>
              </div>
            </div>
            
            {expandedSections.enhancedLive && (
              <div className="p-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-700">
                    🎯 <strong>Live Mode:</strong> Continuous spraakherkenning met automatische transcriptie en speaker detection.
                  </p>
                </div>

                <EnhancedLiveTranscription
                  meetingId={parseInt(id)} // Fix: zorg ervoor dat meetingId een number is
                  participants={meeting?.participants || []}
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  onSessionStatsUpdate={(stats) => console.log('Session stats:', stats)}
                />
              </div>
            )}
          </div>

          {/* 3. Transcriptie Geschiedenis */}
          <div className="modern-card">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer border-b"
              onClick={() => toggleSection('transcriptionHistory')}
            >
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <span>📝</span>
                <span>Transcriptie Geschiedenis</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{transcriptions.length} opgeslagen</span>
                {transcriptions.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTranscriptions([]);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 border border-red-300 rounded"
                  >
                    🗑️ Wis
                  </button>
                )}
                <span className="text-gray-400">
                  {expandedSections.transcriptionHistory ? '▲' : '▼'}
                </span>
              </div>
            </div>
            
            {expandedSections.transcriptionHistory && (
              <div className="p-4">
                {transcriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>Nog geen transcripties</p>
                    <p className="text-sm mt-1">Gebruik een van de opname methoden hierboven</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcriptions
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((transcription, index) => (
                        <div key={transcription.id || `transcription-${index}`} 
                             className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: transcription.speakerColor || '#6B7280' }}
                                ></div>
                                <span className="font-medium text-sm text-gray-700">
                                  {transcription.speaker || 'Audio Upload'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(transcription.timestamp).toLocaleTimeString('nl-NL')}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  transcription.source === 'database' ? 'bg-green-100 text-green-700' :
                                  transcription.source === 'enhanced_live' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {transcription.source === 'database' ? '💾 DB' :
                                   transcription.source === 'enhanced_live' ? '🎯 Live' : '🎤 Upload'}
                                </span>
                              </div>
                              <p className="text-gray-900 text-sm leading-relaxed">
                                {transcription.text}
                              </p>
                            </div>
                            <div className="ml-3 flex flex-col items-end text-xs text-gray-500">
                              <span>
                                {Math.round((transcription.confidence || 0) * 100)}%
                              </span>
                              {transcription.saved && (
                                <span className="text-green-600 mt-1">✓ Saved</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Meeting Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Meeting Details */}
          <div className="modern-card p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
              <span>📋</span>
              <span>Meeting Details</span>
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Titel:</span>
                <span className="font-medium">{meeting?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{meeting?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{meeting?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deelnemers:</span>
                <span className="font-medium">{meeting?.participants?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Participants */}
          {meeting?.participants?.length > 0 && (
            <div className="modern-card p-4">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
                <span>👥</span>
                <span>Deelnemers</span>
              </h3>
              
              <div className="space-y-2">
                {meeting.participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSpeakerColor(index + 1) }}
                    ></div>
                    <span className="font-medium">{participant.name}</span>
                    <span className="text-gray-500 capitalize">({participant.role})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="modern-card p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
              <span>⚡</span>
              <span>Quick Actions</span>
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('basicAudio')}
                className="btn-secondary w-full text-sm py-2"
              >
                🎤 Open Audio Opname
              </button>
              <button
                onClick={() => toggleSection('enhancedLive')}
                className="btn-primary w-full text-sm py-2"
              >
                🎯 Open Live Transcriptie
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-neutral w-full text-sm py-2"
              >
                🔄 Herlaad Pagina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;