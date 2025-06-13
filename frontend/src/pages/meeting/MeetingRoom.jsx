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
const CheckCircle = ({ className }) => <Icon className={className}>✅</Icon>;
const Calendar = ({ className }) => <Icon className={className}>📅</Icon>;

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
};

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
    agenda: true,
    report: false,
    privacy: false
  });

  // Recording mode selection
  const [recordingMode, setRecordingMode] = useState('none'); // 'none', 'manual', 'automatic'

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoTranscriptionActive, setIsAutoTranscriptionActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    confidenceScore: 98.5,
    recentEvents: [
      { type: 'BSN', action: 'gefilterd', time: '2 min geleden', status: 'success' },
      { type: 'Telefoonnummer', action: 'gedetecteerd', time: '5 min geleden', status: 'info' },
      { type: 'Adres', action: 'gemarkeerd', time: '8 min geleden', status: 'warning' }
    ],
    filteredTypes: {
      bsn: 3,
      phone: 2,
      email: 1,
      address: 2
    }
  });

  // Report data
  const [reportData, setReportData] = useState({
    hasReport: false,
    summary: '',
    keyPoints: [],
    actionItems: [],
    nextSteps: []
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

  // Recording mode selection
  const selectRecordingMode = (mode) => {
    setRecordingMode(mode);
    if (mode === 'none') {
      stopRecording();
    }
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
    setRecordingMode('none');
    console.log('⏹️ Recording stopped');
  };

  const pauseRecording = () => {
    setIsRecording(false);
    console.log('⏸️ Recording paused');
  };

  // Delete transcriptions with confirmation
  const handleDeleteTranscriptions = (type) => {
    setDeleteTarget(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteTarget === 'live') {
      setLiveTranscriptions([]);
      console.log('🗑️ Live transcriptions cleared');
    } else if (deleteTarget === 'whisper') {
      setWhisperTranscriptions([]);
      console.log('🗑️ Whisper transcriptions cleared');
    } else {
      setLiveTranscriptions([]);
      setWhisperTranscriptions([]);
      setTranscriptions([]);
      console.log('🗑️ All transcriptions cleared');
    }
    setDeleteTarget(null);
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

  // Agenda functions
  const toggleAgendaItem = (index) => {
    const updatedMeeting = { ...meeting };
    if (updatedMeeting.agenda_items && updatedMeeting.agenda_items[index]) {
      updatedMeeting.agenda_items[index].completed = !updatedMeeting.agenda_items[index].completed;
      setMeeting(updatedMeeting);
    }
  };

  const calculateAgendaProgress = () => {
    if (!meeting?.agenda_items || meeting.agenda_items.length === 0) return 0;
    const completed = meeting.agenda_items.filter(item => item.completed).length;
    return Math.round((completed / meeting.agenda_items.length) * 100);
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
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Transcripties verwijderen"
        message="Weet je zeker dat je deze transcripties wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden."
      />

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
                  {/* Recording Mode Selection */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">Selecteer Opname Modus</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Handmatige Opname Option */}
                      <button
                        onClick={() => selectRecordingMode('manual')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          recordingMode === 'manual'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Mic className="w-5 h-5 text-gray-600" />
                          <h5 className="font-medium text-gray-800">Handmatige Opname</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Start handmatige audio opname zonder automatische transcriptie
                        </p>
                      </button>

                      {/* Automatische Opname Option */}
                      <button
                        onClick={() => selectRecordingMode('automatic')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          recordingMode === 'automatic'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Type className="w-5 h-5 text-blue-600" />
                          <h5 className="font-medium text-gray-800">Automatische Opname</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Start opname met automatische real-time transcriptie
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Recording Content Based on Mode */}
                  {recordingMode === 'manual' && (
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-800 mb-4">📁 Handmatige Audio Opname</h4>
                      
                      {/* Recording Status Display */}
                      <div className="text-center mb-6">
                        <div className="text-4xl font-mono text-slate-800 mb-2">
                          {formatTime(recordingTime)}
                        </div>
                        <div className="text-sm text-slate-600">
                          {isRecording ? (
                            <span className="flex items-center justify-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span>Handmatige opname actief sinds {recordingStartTime ? recordingStartTime.toLocaleTimeString('nl-NL') : ''}</span>
                            </span>
                          ) : (
                            'Opname gestopt'
                          )}
                        </div>
                      </div>

                      {/* Manual Recording Controls */}
                      <div className="flex justify-center space-x-4 mb-6">
                        {!isRecording ? (
                          <button onClick={startManualRecording} className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center">
                            <Play className="w-4 h-4 mr-2" />
                            Start Handmatige Opname
                          </button>
                        ) : (
                          <>
                            <button onClick={pauseRecording} className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center">
                              <Pause className="w-4 h-4 mr-2" />
                              Pauzeer
                            </button>
                            <button onClick={stopRecording} className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
                              <Square className="w-4 h-4 mr-2" />
                              Stop
                            </button>
                          </>
                        )}
                      </div>

                      {/* Audio Upload Component */}
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-700 mb-3">Of upload een audio bestand:</h5>
                        <AudioUploadRecorder
                          onTranscriptionReceived={handleWhisperTranscriptionReceived}
                          meetingId={id}
                          disabled={isRecording}
                        />
                      </div>
                    </div>
                  )}

                  {recordingMode === 'automatic' && (
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-800 mb-4">🤖 Enhanced Live Transcriptie</h4>
                      <EnhancedLiveTranscription
                        meetingId={id}
                        participants={meeting.participants || []}
                        onTranscriptionUpdate={handleLiveTranscriptionReceived}
                        onSessionStatsUpdate={handlers.handleSessionStatsUpdate}
                      />
                    </div>
                  )}

                  {recordingMode === 'none' && (
                    <div className="text-center py-8 text-gray-500">
                      <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Selecteer een opname modus om te beginnen</p>
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
                        handleDeleteTranscriptions('live');
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
                        handleDeleteTranscriptions('whisper');
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
            
            {/* 4. Agenda Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 cursor-pointer hover:from-green-100 hover:to-green-150 transition-all"
                onClick={() => togglePanel('agenda')}
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">📋 Agenda</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {calculateAgendaProgress()}% voltooid
                  </span>
                </div>
                {expandedPanels.agenda ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </div>
              
              {expandedPanels.agenda && (
                <div className="p-4">
                  {meeting?.agenda_items && meeting.agenda_items.length > 0 ? (
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Voortgang</span>
                          <span>{calculateAgendaProgress()}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateAgendaProgress()}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Agenda Items */}
                      <div className="space-y-3">
                        {meeting.agenda_items.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => toggleAgendaItem(index)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              item.completed
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  item.completed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                              >
                                {item.completed && <CheckCircle className="w-3 h-3" />}
                              </button>
                              <div className="flex-1">
                                <h4 className={`font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                {item.estimated_duration && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    ⏱️ ~{item.estimated_duration} min
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Current Agenda Item */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-700 mb-2">📍 Huidig Agendapunt</h4>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="font-medium text-blue-800">
                            {meeting.agenda_items[currentAgendaIndex]?.title || 'Geen actief item'}
                          </p>
                          <p className="text-sm text-blue-600">
                            Item {currentAgendaIndex + 1} van {meeting.agenda_items.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Geen agenda items</p>
                      <p className="text-sm">Dit gesprek heeft geen agenda gedefinieerd</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Verslag Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 cursor-pointer hover:from-purple-100 hover:to-purple-150 transition-all"
                onClick={() => togglePanel('report')}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">📋 Verslag</h3>
                  {reportData.hasReport && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Beschikbaar
                    </span>
                  )}
                </div>
                {expandedPanels.report ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </div>
              
              {expandedPanels.report && (
                <div className="p-4">
                  {reportData.hasReport ? (
                    <div className="space-y-4">
                      {/* Report Summary */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">📝 Samenvatting</h4>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">{reportData.summary}</p>
                        </div>
                      </div>

                      {/* Key Points */}
                      {reportData.keyPoints.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">🎯 Belangrijke Punten</h4>
                          <ul className="space-y-1">
                            {reportData.keyPoints.map((point, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-purple-500 mr-2">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {reportData.actionItems.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">✅ Actiepunten</h4>
                          <ul className="space-y-1">
                            {reportData.actionItems.map((action, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-green-500 mr-2">▶</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps */}
                      {reportData.nextSteps.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">➡️ Vervolgstappen</h4>
                          <ul className="space-y-1">
                            {reportData.nextSteps.map((step, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-blue-500 mr-2">→</span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Meeting Statistics */}
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
                          <button 
                            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm"
                            onClick={() => {
                              // Simulate report generation
                              setReportData({
                                hasReport: true,
                                summary: 'Dit gesprek ging over de voortgang van de werkzoekende. Er zijn concrete vervolgstappen afgesproken.',
                                keyPoints: [
                                  'Sollicitaties zijn verstuurd naar 3 bedrijven',
                                  'Gesprek gepland voor volgende week',
                                  'CV moet worden bijgewerkt'
                                ],
                                actionItems: [
                                  'CV bijwerken voor vrijdag',
                                  'Voorbereiding gesprek bij Bedrijf X',
                                  'Netwerk uitbreiden via LinkedIn'
                                ],
                                nextSteps: [
                                  'Volgende afspraak inplannen over 2 weken',
                                  'Feedback verwerken na sollicitatiegesprek',
                                  'Nieuwe vacatures zoeken in IT sector'
                                ]
                              });
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Genereer Verslag
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Privacy Gevoelige Data Panel */}
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
                    {/* Privacy Status */}
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
                          <span className="font-medium">{privacyData.filteredTypes.bsn} gefilterd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Telefoonnummers</span>
                          <span className="font-medium">{privacyData.filteredTypes.phone} gefilterd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email adressen</span>
                          <span className="font-medium">{privacyData.filteredTypes.email} gefilterd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adressen</span>
                          <span className="font-medium">{privacyData.filteredTypes.address} gefilterd</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Privacy Events */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">📝 Recente Privacy Events</h4>
                      <div className="space-y-2">
                        {privacyData.recentEvents.map((event, index) => (
                          <div key={index} className={`text-xs border rounded p-2 ${
                            event.status === 'success' ? 'bg-green-50 border-green-200' :
                            event.status === 'info' ? 'bg-blue-50 border-blue-200' :
                            'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={
                                event.status === 'success' ? 'text-green-700' :
                                event.status === 'info' ? 'text-blue-700' :
                                'text-yellow-700'
                              }>
                                {event.type} {event.action}
                              </span>
                              <span className={
                                event.status === 'success' ? 'text-green-600' :
                                event.status === 'info' ? 'text-blue-600' :
                                'text-yellow-600'
                              }>
                                {event.time}
                              </span>
                            </div>
                          </div>
                        ))}
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