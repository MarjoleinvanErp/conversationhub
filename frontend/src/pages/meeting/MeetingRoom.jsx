import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor, formatTimestamp } from './utils/meetingUtils.js';
import EnhancedLiveTranscription from '../../components/recording/EnhancedLiveTranscription.jsx';
import AudioUploadRecorder from '../../components/recording/AudioRecorder/AudioUploadRecorder.jsx';

// Simple icon components
const Icon = ({ children, className = "w-4 h-4" }) => (
  <span className={`inline-block ${className}`} style={{ fontSize: '16px' }}>{children}</span>
);

const Mic = ({ className }) => <Icon className={className}>🎤</Icon>;
const Square = ({ className }) => <Icon className={className}>⏹️</Icon>;
const ChevronDown = ({ className }) => <Icon className={className}>⬇️</Icon>;
const ChevronUp = ({ className }) => <Icon className={className}>⬆️</Icon>;
const Trash2 = ({ className }) => <Icon className={className}>🗑️</Icon>;
const Users = ({ className }) => <Icon className={className}>👥</Icon>;
const FileText = ({ className }) => <Icon className={className}>📄</Icon>;
const Settings = ({ className }) => <Icon className={className}>⚙️</Icon>;
const Download = ({ className }) => <Icon className={className}>⬇️</Icon>;
const Send = ({ className }) => <Icon className={className}>📤</Icon>;
const Type = ({ className }) => <Icon className={className}>⌨️</Icon>;
const Shield = ({ className }) => <Icon className={className}>🛡️</Icon>;
const Play = ({ className }) => <Icon className={className}>▶️</Icon>;
const Pause = ({ className }) => <Icon className={className}>⏸️</Icon>;

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meeting, setMeeting] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [liveTranscriptions, setLiveTranscriptions] = useState([]);
  const [whisperTranscriptions, setWhisperTranscriptions] = useState([]);

  // Panel states
  const [expandedPanels, setExpandedPanels] = useState({
    recording: true,
    liveTranscription: true,
    whisperTranscription: true,
    report: false,
    privacy: false
  });

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoTranscriptionActive, setIsAutoTranscriptionActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);

  // Speaker management
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // Agenda management
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Privacy data
  const [privacyData, setPrivacyData] = useState({
    totalFiltered: 8,
    confidenceScore: 98.5
  });

  // Initialize meeting handlers
  const handlers = useMeetingHandlers({
    id, transcriptions, setTranscriptions, currentSpeaker, setCurrentSpeaker,
    availableSpeakers, setAvailableSpeakers, speakerStats, setSpeakerStats,
    currentAgendaIndex, setCurrentAgendaIndex, agendaStartTimes, setAgendaStartTimes, meeting
  });

  // Load meeting data
  useEffect(() => {
    loadMeetingData();
  }, [id]);

  // Setup speakers when meeting loads
  useEffect(() => {
    if (meeting && meeting.participants) {
      setupSpeakers();
    }
  }, [meeting]);

  // Timer for recording
  useEffect(() => {
    let interval = null;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date() - recordingStartTime) / 1000);
        setRecordingTime(elapsed);
      }, 1000);
    } else if (!isRecording) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  // Load meeting and transcription data
  const loadMeetingData = async () => {
    try {
      setLoading(true);
      setError('');

      const meetingResult = await meetingService.getMeeting(id);
      if (!meetingResult.success) {
        throw new Error(meetingResult.message || 'Failed to load meeting');
      }
      setMeeting(meetingResult.data);

      const transcriptionsResult = await transcriptionService.getTranscriptions(id);
      if (transcriptionsResult.success) {
        const allTranscriptions = transcriptionsResult.data || [];
        setTranscriptions(allTranscriptions);
        setLiveTranscriptions(allTranscriptions.filter(t => t.source === 'live' || t.source === 'speech'));
        setWhisperTranscriptions(allTranscriptions.filter(t => t.source === 'whisper' || t.source === 'upload'));
      }

      if (meetingResult.data.agenda_items && meetingResult.data.agenda_items.length > 0) {
        setAgendaStartTimes({ 0: new Date() });
      }
    } catch (error) {
      console.error('Error loading meeting data:', error);
      setError(error.message || 'Failed to load meeting data');
    } finally {
      setLoading(false);
    }
  };

  // Setup available speakers from meeting participants
  const setupSpeakers = () => {
    const speakers = [];
    if (meeting.participants) {
      meeting.participants.forEach((participant, index) => {
        speakers.push({
          id: `participant_${participant.id || index}`,
          name: participant.name,
          displayName: participant.name,
          role: participant.role || 'participant',
          color: getSpeakerColor(index),
          isActive: false,
          isParticipant: true
        });
      });
    }

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
    if (speakers.length > 0) {
      setCurrentSpeaker(speakers[0]);
    }

    const initialStats = {};
    speakers.forEach(speaker => {
      initialStats[speaker.id] = { totalTime: 0, segments: 0 };
    });
    setSpeakerStats(initialStats);
  };

  // Helper functions
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePanel = (panelName) => {
    setExpandedPanels(prev => ({...prev, [panelName]: !prev[panelName]}));
  };

  // Recording management
  const startManualRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(new Date());
    setRecordingTime(0);
    console.log('🎤 Manual recording started');
  };

  const startAutoTranscription = () => {
    setIsAutoTranscriptionActive(true);
    setIsRecording(true);
    setRecordingStartTime(new Date());
    setRecordingTime(0);
    console.log('🤖 Auto transcription started');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsAutoTranscriptionActive(false);
    setRecordingStartTime(null);
    console.log('⏹️ Recording stopped');
  };

  const pauseRecording = () => {
    setIsRecording(false);
    console.log('⏸️ Recording paused');
  };

  // Transcription handlers
  const handleLiveTranscriptionReceived = (transcriptionData) => {
    console.log('📝 Live transcription received:', transcriptionData);
    
    const newTranscription = {
      ...transcriptionData,
      id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'live',
      timestamp: new Date(),
      panel: 'live'
    };

    setLiveTranscriptions(prev => [...prev, newTranscription]);
    handlers.handleTranscriptionReceived(newTranscription);
  };

  const handleWhisperTranscriptionReceived = (transcriptionData) => {
    console.log('🤖 Whisper transcription received:', transcriptionData);
    
    const newTranscription = {
      ...transcriptionData,
      id: `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'whisper',
      timestamp: new Date(),
      panel: 'whisper'
    };

    setWhisperTranscriptions(prev => [...prev, newTranscription]);
    handlers.handleTranscriptionReceived(newTranscription);
  };

  const clearTranscriptions = (type) => {
    if (type === 'live') {
      setLiveTranscriptions([]);
    } else if (type === 'whisper') {
      setWhisperTranscriptions([]);
    } else {
      setLiveTranscriptions([]);
      setWhisperTranscriptions([]);
      setTranscriptions([]);
    }
  };

  const navigateToMeetings = () => {
    navigate('/dashboard');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gesprek laden...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Fout bij laden</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show error if no meeting found
  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Gesprek niet gevonden</h2>
          <p className="text-gray-600 mb-4">Het gesprek met ID {id} kon niet worden gevonden.</p>
          <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header met Meeting Info */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={navigateToMeetings} className="text-slate-600 hover:text-slate-900 transition-colors">
                ← Terug naar dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
                <p className="text-slate-600">
                  {meeting.participants && meeting.participants.length > 0 
                    ? `Met ${meeting.participants.map(p => p.name).join(', ')}`
                    : 'Geen deelnemers'
                  } • 
                  {meeting.scheduled_at 
                    ? `Gepland voor ${new Date(meeting.scheduled_at).toLocaleString('nl-NL')}`
                    : 'Niet gepland'
                  }
                </p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center space-x-4">
              {isRecording && (
                <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Opname actief: {formatTime(recordingTime)}</span>
                </div>
              )}
              
              {isAutoTranscriptionActive && (
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                  <Type className="w-4 h-4" />
                  <span className="font-medium">Auto-transcriptie actief</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - 8 kolommen breed */}
          <div className="col-span-8 space-y-6">
            
            {/* 1. Opname Meeting Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 cursor-pointer hover:from-red-100 hover:to-red-150 transition-all"
                onClick={() => togglePanel('recording')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <h3 className="font-semibold text-slate-900">🎤 Opname Meeting</h3>
                  {isRecording && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {formatTime(recordingTime)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {expandedPanels.recording ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>
              
              {expandedPanels.recording && (
                <div className="p-6">
                  {/* Recording Status Display */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-mono text-slate-800 mb-2">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {isRecording ? (
                        <span className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span>Opname actief sinds {recordingStartTime ? recordingStartTime.toLocaleTimeString('nl-NL') : ''}</span>
                        </span>
                      ) : (
                        'Opname gestopt'
                      )}
                    </div>
                  </div>

                  {/* Recording Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Handmatige Opname */}
                    <div className="modern-card p-4 border-2 border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <Mic className="w-4 h-4 mr-2" />
                        Handmatige Opname
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Start handmatige audio opname zonder automatische transcriptie
                      </p>
                      
                      <div className="flex space-x-2">
                        {!isRecording ? (
                          <button onClick={startManualRecording} className="btn-primary flex-1">
                            <Play className="w-4 h-4 mr-2" />
                            Start Opname
                          </button>
                        ) : (
                          <>
                            <button onClick={pauseRecording} className="btn-neutral flex-1">
                              <Pause className="w-4 h-4 mr-2" />
                              Pauzeer
                            </button>
                            <button onClick={stopRecording} className="btn-danger">
                              <Square className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Automatische Opname + Transcriptie */}
                    <div className="modern-card p-4 border-2 border-blue-200 bg-blue-50">
                      <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                        <Type className="w-4 h-4 mr-2" />
                        Auto Opname + Transcriptie
                      </h4>
                      <p className="text-sm text-blue-600 mb-4">
                        Start opname met automatische real-time transcriptie
                      </p>
                      
                      <div className="flex space-x-2">
                        {!isAutoTranscriptionActive ? (
                          <button onClick={startAutoTranscription} className="btn-primary flex-1">
                            <Type className="w-4 h-4 mr-2" />
                            Start Auto-transcriptie
                          </button>
                        ) : (
                          <>
                            <button onClick={pauseRecording} className="btn-neutral flex-1">
                              <Pause className="w-4 h-4 mr-2" />
                              Pauzeer
                            </button>
                            <button onClick={stopRecording} className="btn-danger">
                              <Square className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Audio Upload Recorder */}
                  {!isRecording && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-3">📁 Audio Bestand Uploaden</h4>
                      <AudioUploadRecorder
                        onTranscriptionReceived={handleWhisperTranscriptionReceived}
                        meetingId={id}
                        disabled={isRecording}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Live Transcriptie Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-all"
                onClick={() => togglePanel('liveTranscription')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isAutoTranscriptionActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <h3 className="font-semibold text-slate-900">🎤 Live Transcriptie</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {liveTranscriptions.length} items
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {liveTranscriptions.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTranscriptions('live');
                      }}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                      title="Wis live transcripties"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {expandedPanels.liveTranscription ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>
              
              {expandedPanels.liveTranscription && (
                <div className="p-4">
                  {isAutoTranscriptionActive && (
                    <EnhancedLiveTranscription
                      meetingId={id}
                      participants={meeting.participants || []}
                      onTranscriptionUpdate={handleLiveTranscriptionReceived}
                      onSessionStatsUpdate={handlers.handleSessionStatsUpdate}
                    />
                  )}

                  {/* Live Transcription History */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {liveTranscriptions.map((entry) => (
                      <div key={entry.id} className="flex space-x-3 p-3 rounded-lg hover:bg-blue-50 border border-blue-100">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: entry.speakerColor || entry.speaker_color || '#3B82F6' }}
                          >
                            {(entry.speaker || entry.speaker_name || 'S').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-slate-900">{entry.speaker || entry.speaker_name}</span>
                            <span className="text-xs text-slate-500">
                              {entry.timestamp ? formatTimestamp(entry.timestamp) : 'Nu'}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Live
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                    {liveTranscriptions.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Type className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Geen live transcripties</p>
                        <p className="text-sm">Start auto-transcriptie om live tekst hier te zien</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Whisper Transcriptie Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 cursor-pointer hover:from-green-100 hover:to-green-150 transition-all"
                onClick={() => togglePanel('whisperTranscription')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="font-semibold text-slate-900">🤖 Whisper Transcriptie</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {whisperTranscriptions.length} items
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {whisperTranscriptions.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTranscriptions('whisper');
                      }}
                      className="p-1 rounded hover:bg-red-100 text-red-600"
                      title="Wis whisper transcripties"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {expandedPanels.whisperTranscription ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>
              
              {expandedPanels.whisperTranscription && (
                <div className="p-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {whisperTranscriptions.map((entry) => (
                      <div key={entry.id} className="flex space-x-3 p-3 rounded-lg hover:bg-green-50 border border-green-100">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: entry.speakerColor || entry.speaker_color || '#10B981' }}
                          >
                            {(entry.speaker || entry.speaker_name || 'S').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-slate-900">{entry.speaker || entry.speaker_name}</span>
                            <span className="text-xs text-slate-500">
                              {entry.timestamp ? formatTimestamp(entry.timestamp) : 'Nu'}
                            </span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Whisper
                            </span>
                            {entry.confidence && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {Math.round(entry.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 leading-relaxed font-medium">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                    {whisperTranscriptions.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Geen Whisper transcripties</p>
                        <p className="text-sm">Upload audiobestanden om Whisper transcripties te zien</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 4 kolommen breed */}
          <div className="col-span-4 space-y-6">
            
            {/* 4. Verslag Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 cursor-pointer hover:from-purple-100 hover:to-purple-150 transition-all"
                onClick={() => togglePanel('report')}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">📋 Verslag</h3>
                </div>
                {expandedPanels.report ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </div>
              
              {expandedPanels.report && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">📊 Gesprek Statistieken</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Duur:</span>
                          <div className="font-medium">{formatTime(recordingTime)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Transcripties:</span>
                          <div className="font-medium">{liveTranscriptions.length + whisperTranscriptions.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Deelnemers:</span>
                          <div className="font-medium">{meeting.participants?.length || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Agenda items:</span>
                          <div className="font-medium">{meeting.agenda_items?.length || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Agenda Progress */}
                    {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">📋 Agenda Voortgang</h4>
                        <div className="space-y-2">
                          {meeting.agenda_items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <div className={`w-3 h-3 rounded-full ${
                                item.completed ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                              <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                {item.title}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(meeting.agenda_items.filter(item => item.completed).length / meeting.agenda_items.length) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Export Actions */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-3">📤 Export Opties</h4>
                      <div className="space-y-2">
                        <button 
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                          onClick={() => {
                            alert('Download verslag functionaliteit wordt nog geïmplementeerd');
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Verslag
                        </button>
                        <button 
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                          onClick={() => {
                            alert('N8N export functionaliteit wordt nog geïmplementeerd');
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Verstuur naar N8N
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Privacy Gevoelige Data Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 cursor-pointer hover:from-yellow-100 hover:to-yellow-150 transition-all"
                onClick={() => togglePanel('privacy')}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-slate-900">🛡️ Privacy Gevoelige Data</h3>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    {privacyData.totalFiltered} gefilterd
                  </span>
                </div>
                {expandedPanels.privacy ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </div>
              
              {expandedPanels.privacy && (
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🔒 Privacy Status</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">AVG Compliance</span>
                            <span className="font-semibold text-green-600">{privacyData.confidenceScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${privacyData.confidenceScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtered Data Types */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">🔍 Gefilterde Data Types</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">BSN Nummers</span>
                          <span className="font-medium">3 gefilterd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Telefoonnummers</span>
                          <span className="font-medium">2 gefilterd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email adressen</span>
                          <span className="font-medium">1 gefilterd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adressen</span>
                          <span className="font-medium">2 gefilterd</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Privacy Events */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">📝 Recente Privacy Events</h4>
                      <div className="space-y-2">
                        <div className="text-xs bg-green-50 border border-green-200 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700">BSN automatisch gefilterd</span>
                            <span className="text-green-600">2 min geleden</span>
                          </div>
                        </div>
                        <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700">Telefoonnummer gedetecteerd</span>
                            <span className="text-blue-600">5 min geleden</span>
                          </div>
                        </div>
                        <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-700">Adres gemarkeerd</span>
                            <span className="text-yellow-600">8 min geleden</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-3">⚙️ Privacy Instellingen</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>Auto-filter BSN nummers</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>Auto-filter telefoonnummers</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>Auto-filter email adressen</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span>Auto-filter adressen</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Speaker Selection */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-600" />
                🎤 Actieve Spreker
              </h3>
              <div className="space-y-2">
                {availableSpeakers.slice(0, 3).map((speaker) => (
                  <button
                    key={speaker.id}
                    onClick={() => handlers.handleSpeakerChange(speaker)}
                    className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all text-sm ${
                      currentSpeaker?.id === speaker.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: speaker.color }}
                    >
                      {speaker.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-left font-medium">{speaker.displayName}</span>
                    {currentSpeaker?.id === speaker.id && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;