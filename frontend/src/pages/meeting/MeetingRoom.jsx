import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import EnhancedLiveTranscription from '../../components/recording/EnhancedLiveTranscription.jsx';
import BasicAudioUploader from '../../components/recording/AudioRecorder/BasicAudioUploader.jsx'; // ← DEZE TOEVOEGEN
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor, formatSpeakingTime, formatTimestamp } from './utils/meetingUtils.js';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transcription state
  const [transcriptions, setTranscriptions] = useState([]);
  const [liveTranscriptions, setLiveTranscriptions] = useState([]);

  // Speaker state
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // UI state - collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    participants: false,
    agenda: true, // Start collapsed if agenda is long
    controls: false,
    stats: true
  });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);

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


{/* Main Content - Enhanced Transcription */}
<div className="lg:col-span-3 space-y-4">
  {/* Enhanced Live Transcription Component */}
  <div className="modern-card">
    <EnhancedLiveTranscription
      meetingId={id}
      participants={meeting?.participants || []}
      onTranscriptionUpdate={handleTranscriptionUpdate}
      onSessionStatsUpdate={handleSessionStatsUpdate}
    />
  </div>

  {/* Alternative: Basic Audio Upload (Always Available) */}
  <div className="modern-card p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">🎤 Audio Upload & Transcriptie</h3>
      <span className="text-sm text-gray-500">Stap-voor-stap opname</span>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="text-sm text-blue-700">
        💡 <strong>Tip:</strong> Gebruik Enhanced Live Transcriptie hierboven voor real-time spraak-naar-tekst, 
        of upload hieronder audio bestanden die je apart hebt opgenomen.
      </p>
    </div>

    <BasicAudioUploader
      onTranscriptionReceived={handleTranscriptionUpdate}
      meetingId={id}
      disabled={false}
    />
  </div>

  {/* Session Status Bar */}
  {sessionStats && (
    <div className="modern-card p-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Live: {sessionStats.status_breakdown?.live || 0}</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Verified: {sessionStats.status_breakdown?.verified || 0}</span>
          </span>
          <span className="text-gray-500">
            {Math.round((sessionStats.status_breakdown?.verified || 0) / 
            Math.max(1, sessionStats.total_transcriptions || 1) * 100)}% verified
          </span>
        </div>
        <div className="text-gray-500">
          {sessionStats.duration_minutes || 0}m actief
        </div>
      </div>
    </div>
  )}

  {/* Transcription History Display */}
  <div className="modern-card p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">📝 Transcriptie Geschiedenis</h3>
      <span className="text-sm text-gray-500">
        {transcriptions.length} opgeslagen transcripties
      </span>
    </div>
    
    {transcriptions.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🎤</div>
        <p>Nog geen transcripties opgenomen</p>
        <p className="text-sm mt-1">Start Enhanced Live Transcriptie of upload audio bestanden hierboven</p>
      </div>
    ) : (
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {transcriptions
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map((transcription) => (
            <div key={transcription.id} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: transcription.speakerColor }}
                    ></div>
                    <span className="font-medium text-sm text-gray-700">
                      {transcription.speaker}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(transcription.timestamp).toLocaleTimeString('nl-NL')}
                    </span>
                  </div>
                  <p className="text-gray-900 text-sm leading-relaxed">
                    {transcription.text}
                  </p>
                </div>
                <div className="ml-3 flex flex-col items-end text-xs text-gray-500">
                  <span>
                    {Math.round((transcription.confidence || 0) * 100)}% confident
                  </span>
                  {transcription.saved && (
                    <span className="text-green-600 mt-1">✓ Opgeslagen</span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
</div>

  // Enhanced transcription handlers
  const handleTranscriptionUpdate = (transcriptionData) => {
    // Add to live transcriptions for immediate display
    setLiveTranscriptions(prev => [...prev.slice(-10), transcriptionData]); // Keep last 10
    handlers.handleTranscriptionReceived(transcriptionData);
  };

  const handleSessionStatsUpdate = (stats) => {
    setSessionStats(stats);
    handlers.handleSessionStatsUpdate(stats);
  };

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Quick speaker change
  const quickSpeakerChange = (speaker) => {
    setCurrentSpeaker(speaker);
    setAvailableSpeakers(prev => prev.map(s => ({
      ...s,
      isActive: s.id === speaker.id
    })));
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
      {/* Compact Header */}
      <div className="modern-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h1 className="text-xl font-bold text-gray-900">{meeting?.title}</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>👥 {meeting?.participants?.length || 0}</span>
              <span>📋 {currentAgendaIndex + 1}/{meeting?.agenda_items?.length || 0}</span>
              {currentSpeaker && (
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSpeaker.color }}></div>
                  <span>{currentSpeaker.displayName}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => navigate('/dashboard')} className="btn-neutral text-sm px-3 py-1">
              🏠
            </button>
            <button onClick={finishMeeting} className="btn-danger text-sm px-3 py-1">
              ⏹️ Stop
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Content - Enhanced Transcription */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live Transcription Component */}
<div className="modern-card">
  <BasicAudioUploader
    meetingId={id}
    onTranscriptionReceived={handleTranscriptionUpdate}
  />
</div>
          {/* Session Status Bar */}
          {sessionStats && (
            <div className="modern-card p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Live: {sessionStats.status_breakdown?.live || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Verified: {sessionStats.status_breakdown?.verified || 0}</span>
                  </span>
                  <span className="text-gray-500">
                    {Math.round((sessionStats.status_breakdown?.verified || 0) / 
                    Math.max(1, sessionStats.total_transcriptions || 1) * 100)}% verified
                  </span>
                </div>
                <div className="text-gray-500">
                  {sessionStats.duration_minutes || 0}m actief
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Compact Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Speaker Selector */}
          <div className="modern-card">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => toggleSection('participants')}
            >
              <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                <span>👤</span>
                <span>Sprekers</span>
              </h3>
              <span className="text-gray-400">
                {collapsedSections.participants ? '▼' : '▲'}
              </span>
            </div>
            
            {!collapsedSections.participants && (
              <div className="px-3 pb-3 space-y-2">
                {availableSpeakers.slice(0, 4).map((speaker) => (
                  <button
                    key={speaker.id}
                    onClick={() => quickSpeakerChange(speaker)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-all ${
                      currentSpeaker?.id === speaker.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: speaker.color }}
                      ></div>
                      <span className="font-medium truncate">{speaker.displayName}</span>
                      {currentSpeaker?.id === speaker.id && (
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse ml-auto"></div>
                      )}
                    </div>
                  </button>
                ))}
                
                {availableSpeakers.length > 4 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{availableSpeakers.length - 4} meer...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Agenda */}
          <div className="modern-card">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => toggleSection('agenda')}
            >
              <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                <span>📋</span>
                <span>Agenda</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {currentAgendaIndex + 1}/{meeting?.agenda_items?.length || 0}
                </span>
                <span className="text-gray-400">
                  {collapsedSections.agenda ? '▼' : '▲'}
                </span>
              </div>
            </div>
            
            {!collapsedSections.agenda && meeting?.agenda_items && (
              <div className="px-3 pb-3">
                {/* Current Item */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-600">HUIDIGE</span>
                    <span className="text-xs text-blue-500">
                      {agendaStartTimes[currentAgendaIndex] && 
                        formatTimestamp(agendaStartTimes[currentAgendaIndex])}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-800">
                    {meeting.agenda_items[currentAgendaIndex]?.title}
                  </h4>
                </div>

                {/* Navigation */}
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={handlers.handlePreviousAgendaItem}
                    disabled={currentAgendaIndex <= 0}
                    className="btn-neutral text-xs px-2 py-1 flex-1 disabled:opacity-50"
                  >
                    ← Vorige
                  </button>
                  <button
                    onClick={handlers.handleNextAgendaItem}
                    disabled={currentAgendaIndex >= (meeting.agenda_items.length - 1)}
                    className="btn-primary text-xs px-2 py-1 flex-1 disabled:opacity-50"
                  >
                    Volgende →
                  </button>
                </div>

                {/* Progress */}
                <div className="bg-gray-200 rounded-full h-1 mb-2">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((currentAgendaIndex + 1) / meeting.agenda_items.length) * 100}%` 
                    }}
                  ></div>
                </div>

                {/* All Items (compact) */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {meeting.agenda_items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handlers.handleGoToAgendaItem(index)}
                      className={`w-full text-left p-1 rounded text-xs transition-all ${
                        index === currentAgendaIndex
                          ? 'bg-blue-100 text-blue-800'
                          : index < currentAgendaIndex
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium">{index + 1}.</span> {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Speaker Stats */}
          <div className="modern-card">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => toggleSection('stats')}
            >
              <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                <span>📊</span>
                <span>Stats</span>
              </h3>
              <span className="text-gray-400">
                {collapsedSections.stats ? '▼' : '▲'}
              </span>
            </div>
            
            {!collapsedSections.stats && (
              <div className="px-3 pb-3 space-y-2">
                {availableSpeakers
                  .filter(speaker => speakerStats[speaker.id]?.segments > 0)
                  .sort((a, b) => (speakerStats[b.id]?.totalTime || 0) - (speakerStats[a.id]?.totalTime || 0))
                  .slice(0, 3)
                  .map((speaker) => (
                    <div key={speaker.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: speaker.color }}
                        ></div>
                        <span className="truncate">{speaker.displayName}</span>
                      </div>
                      <span className="text-gray-500">
                        {formatSpeakingTime(speakerStats[speaker.id]?.totalTime || 0)}
                      </span>
                    </div>
                  ))}
                
                {Object.values(speakerStats).every(stat => stat.segments === 0) && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Nog geen statistieken
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;