import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import EnhancedLiveTranscription from '../../components/recording/EnhancedLiveTranscription.jsx';
import BasicAudioUploader from '../../components/recording/AudioRecorder/BasicAudioUploader.jsx';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor } from './utils/meetingUtils.js';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Meeting data
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transcription state
  const [transcriptions, setTranscriptions] = useState([]);
  const [transcriptionMode, setTranscriptionMode] = useState('none'); // 'none', 'manual', 'enhanced'

  // Speaker state
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // Agenda tracking
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Load meeting
  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      const result = await meetingService.getMeeting(id);
      if (result.success) {
        setMeeting(result.data);
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

  // Handle transcription updates
  const handleTranscriptionUpdate = (transcriptionData) => {
    handlers.handleTranscriptionReceived(transcriptionData);
  };

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
          Terug naar Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{meeting?.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🆔 {id}</span>
              <span>👥 {meeting?.participants?.length || 0} deelnemers</span>
              <span>📝 {transcriptions.length} transcripties</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => navigate('/dashboard')} className="btn-neutral px-4 py-2">
              🏠 Dashboard
            </button>
            <button onClick={finishMeeting} className="btn-danger px-4 py-2">
              ⏹️ Stop Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Links Transcriptie, Rechts Meeting Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LINKS: Transcriptie Gebied (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Transcriptie Mode Selector */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-4">🎤 Transcriptie Opties</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => setTranscriptionMode('none')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  transcriptionMode === 'none'
                    ? 'border-gray-500 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">⏸️ Geen Transcriptie</div>
                <div className="text-sm text-gray-600">Handmatige notities</div>
              </button>
              
              <button
                onClick={() => setTranscriptionMode('manual')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  transcriptionMode === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">🎤 Handmatige Opname</div>
                <div className="text-sm text-gray-600">Opnemen → Stop → Transcribeer</div>
              </button>
              
              <button
                onClick={() => setTranscriptionMode('enhanced')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  transcriptionMode === 'enhanced'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">🎯 Live Transcriptie</div>
                <div className="text-sm text-gray-600">Real-time spraak naar tekst</div>
              </button>
            </div>
          </div>

          {/* Transcriptie Component op basis van gekozen mode */}
          {transcriptionMode === 'manual' && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">🎤 Handmatige Audio Opname</h3>
              </div>
              <div className="p-6">
                <BasicAudioUploader
                  onTranscriptionReceived={handleTranscriptionUpdate}
                  meetingId={parseInt(id)}
                />
              </div>
            </div>
          )}

          {transcriptionMode === 'enhanced' && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">🎯 Enhanced Live Transcriptie</h3>
              </div>
              <div className="p-6">
                <EnhancedLiveTranscription
                  meetingId={parseInt(id)}
                  participants={meeting?.participants || []}
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  onSessionStatsUpdate={(stats) => console.log('Session stats:', stats)}
                />
              </div>
            </div>
          )}

          {transcriptionMode === 'none' && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Handmatige Notities</h3>
              <p className="text-gray-600 mb-4">
                Kies een transcriptie optie hierboven om te beginnen met opnemen.
              </p>
            </div>
          )}

          {/* Transcriptie Geschiedenis */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-medium">📝 Transcriptie Geschiedenis ({transcriptions.length})</h3>
            </div>
            <div className="p-4">
              {transcriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-3xl mb-2">💬</div>
                  <p>Nog geen transcripties</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transcriptions
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((transcription, index) => (
                      <div key={transcription.id || index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: transcription.speakerColor || '#6B7280' }}
                            ></div>
                            <span className="font-medium text-sm">
                              {transcription.speaker || 'Audio Upload'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(transcription.timestamp).toLocaleTimeString('nl-NL')}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round((transcription.confidence || 0) * 100)}%
                          </span>
                        </div>
                        <p className="text-gray-900">{transcription.text}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RECHTS: Meeting Informatie (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Meeting Details */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-4">📋 Meeting Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium capitalize">{meeting?.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium capitalize">{meeting?.status}</span>
              </div>
              {meeting?.description && (
                <div>
                  <span className="text-gray-600">Beschrijving:</span>
                  <p className="mt-1 text-gray-900">{meeting.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Deelnemers */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-4">👥 Deelnemers ({meeting?.participants?.length || 0})</h3>
            {meeting?.participants?.length > 0 ? (
              <div className="space-y-2">
                {meeting.participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getSpeakerColor(index + 1) }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{participant.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{participant.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Geen deelnemers geregistreerd</p>
            )}
          </div>

          {/* Agenda */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-4">📝 Agenda ({meeting?.agenda_items?.length || 0})</h3>
            {meeting?.agenda_items?.length > 0 ? (
              <div className="space-y-2">
                {meeting.agenda_items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      index === currentAgendaIndex
                        ? 'border-blue-500 bg-blue-50'
                        : index < currentAgendaIndex
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">
                        {index + 1}. {item.title}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600">{item.description}</p>
                    )}
                    {item.estimated_duration && (
                      <p className="text-xs text-gray-500">~{item.estimated_duration} min</p>
                    )}
                  </div>
                ))}
                
                {/* Agenda Navigatie */}
                <div className="flex justify-between pt-3">
                  <button
                    onClick={handlers.handlePreviousAgendaItem}
                    disabled={currentAgendaIndex <= 0}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded disabled:opacity-50"
                  >
                    ← Vorige
                  </button>
                  <span className="text-xs text-gray-600 flex items-center">
                    {currentAgendaIndex + 1} / {meeting.agenda_items.length}
                  </span>
                  <button
                    onClick={handlers.handleNextAgendaItem}
                    disabled={currentAgendaIndex >= meeting.agenda_items.length - 1}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded disabled:opacity-50"
                  >
                    Volgende →
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Geen agenda items</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;