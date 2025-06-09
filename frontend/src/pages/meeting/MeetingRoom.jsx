// MAYO DEEL 1 - HOOFD MEETINGROOM COMPONENT
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import { MeetingRoomTabs } from './components/MeetingRoomTabs.jsx';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor, formatSpeakingTime } from './utils/meetingUtils.js';

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
  const [activeTab, setActiveTab] = useState('transcription');

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

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

  // Load meeting data
  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      const result = await meetingService.getMeeting(id);
      if (result.success) {
        setMeeting(result.data);
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
          processingStatus: 'verified'
        }));
        setTranscriptions(dbTranscriptions);
      }
    } catch (error) {
      console.error('Failed to load transcriptions:', error);
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

  // Get handlers from custom hook
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

  // Loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Gesprek laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Er is een fout opgetreden</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Terug naar Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MAYO DEEL 1 - MEETING HEADER */}
      <div className="modern-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Meeting Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">LIVE MEETING</span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {meeting?.title}
            </h1>
            
            <p className="text-gray-600 mb-3">{meeting?.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-1">
                <span>👥</span>
                <span className="text-gray-600">{meeting?.participants?.length || 0} deelnemers</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📋</span>
                <span className="text-gray-600">{meeting?.agenda_items?.length || 0} agenda punten</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🎤</span>
                <span className="text-blue-600 font-medium">Enhanced Live Transcriptie</span>
              </div>
              {currentSpeaker && (
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentSpeaker.color }}
                  ></div>
                  <span className="text-purple-600 font-medium">
                    Actieve spreker: {currentSpeaker.displayName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-600">Live</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Geverifieerd</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-neutral px-4 py-2"
              >
                🏠 Dashboard
              </button>
              <button 
                onClick={finishMeeting}
                className="btn-danger px-4 py-2"
              >
                ⏹️ Beëindigen
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t pt-4 mt-6">
          <div className="flex space-x-1">
            {[
              { id: 'transcription', label: 'Live Transcriptie', icon: '🎤' },
              { id: 'participants', label: 'Deelnemers', icon: '👥' },
              { id: 'agenda', label: 'Agenda', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'btn-primary text-white'
                    : 'btn-neutral text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Session Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="modern-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">🎤</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Enhanced Live</h3>
              <p className="text-sm text-blue-600">Voice recognition actief</p>
            </div>
          </div>
        </div>

        <div className="modern-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Azure Whisper</h3>
              <p className="text-sm text-green-600">30s verificatie chunks</p>
            </div>
          </div>
        </div>

        <div className="modern-card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">🔍</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Speaker Detection</h3>
              <p className="text-sm text-purple-600">Voice fingerprinting</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAYO DEEL 1 EINDE - TAB CONTENT WORDT GELADEN UIT ANDER BESTAND */}
      <MeetingRoomTabs
        activeTab={activeTab}
        meetingId={id}
        meeting={meeting}
        currentSpeaker={currentSpeaker}
        availableSpeakers={availableSpeakers}
        speakerStats={speakerStats}
        showAudioUploader={showAudioUploader}
        setShowAudioUploader={setShowAudioUploader}
        currentAgendaIndex={currentAgendaIndex}
        agendaStartTimes={agendaStartTimes}
        handlers={handlers}
      />
    </div>
  );
};

export default MeetingRoom;