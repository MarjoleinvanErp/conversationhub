import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor } from './utils/meetingUtils.js';

// Import alle nieuwe components
import {
  MeetingHeader,
  RecordingPanel,
  LiveTranscriptionPanel,
  WhisperTranscriptionPanel,
  AgendaPanel,
  ReportPanel,
  PrivacyPanel,
  SpeakerPanel,
  ConfirmationModal
} from '../../components/meeting/MeetingRoom/index.js';

// Debug Component - VERWIJDER DIT IN PRODUCTIE
const DebugPanel = ({ transcriptions, liveTranscriptions, whisperTranscriptions }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-purple-700"
        >
          🐛 Debug Data
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-500 rounded-lg p-4 max-w-md max-h-96 overflow-y-auto shadow-lg z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-purple-800">Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-purple-600 hover:text-purple-800"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3 text-xs">
        <div>
          <h4 className="font-semibold text-gray-700">📊 Totaal Overzicht</h4>
          <p>Alle transcripties: {transcriptions.length}</p>
          <p>Live transcripties: {liveTranscriptions.length}</p>
          <p>Whisper transcripties: {whisperTranscriptions.length}</p>
        </div>

        <div>
          <h4 className="font-semibold text-green-700">🎤 Live Transcripties</h4>
          {liveTranscriptions.length === 0 ? (
            <p className="text-gray-500">Geen live transcripties</p>
          ) : (
            liveTranscriptions.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-green-50 p-2 rounded mb-1">
                <p><strong>ID:</strong> {t.id}</p>
                <p><strong>Source:</strong> {t.source}</p>
                <p><strong>Speaker:</strong> {t.speaker_name || t.speaker}</p>
                <p><strong>Text:</strong> {(t.text || '').substring(0, 50)}...</p>
                <p><strong>Timestamp:</strong> {t.created_at ? new Date(t.created_at).toLocaleTimeString() : 'Nu'}</p>
              </div>
            ))
          )}
          {liveTranscriptions.length > 3 && (
            <p className="text-gray-500">... en {liveTranscriptions.length - 3} meer</p>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-blue-700">🤖 Whisper Transcripties</h4>
          {whisperTranscriptions.length === 0 ? (
            <p className="text-gray-500">Geen whisper transcripties</p>
          ) : (
            whisperTranscriptions.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-blue-50 p-2 rounded mb-1">
                <p><strong>ID:</strong> {t.id}</p>
                <p><strong>Source:</strong> {t.source}</p>
                <p><strong>Speaker:</strong> {t.speaker_name || t.speaker}</p>
                <p><strong>Text:</strong> {(t.text || '').substring(0, 50)}...</p>
                <p><strong>Confidence:</strong> {t.confidence ? Math.round(parseFloat(t.confidence) * 100) + '%' : 'N/A'}</p>
                <p><strong>Timestamp:</strong> {t.created_at ? new Date(t.created_at).toLocaleTimeString() : 'Nu'}</p>
              </div>
            ))
          )}
          {whisperTranscriptions.length > 3 && (
            <p className="text-gray-500">... en {whisperTranscriptions.length - 3} meer</p>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-gray-700">🔄 Source Types</h4>
          {Object.entries(transcriptions.reduce((acc, t) => {
            acc[t.source] = (acc[t.source] || 0) + 1;
            return acc;
          }, {})).map(([source, count]) => (
            <p key={source}>{source}: {count}</p>
          ))}
        </div>

        <div className="pt-2 border-t">
          <button
            onClick={() => {
              console.log('🐛 DEBUG DATA:', {
                allTranscriptions: transcriptions,
                liveTranscriptions,
                whisperTranscriptions
              });
              alert('Debug data logged to console (F12)');
            }}
            className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
          >
            Log to Console
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
  const [isDeleting, setIsDeleting] = useState(false);

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

      console.log('📥 Loading meeting data for ID:', id);

      const meetingResult = await meetingService.getMeeting(id);
      if (!meetingResult.success) {
        throw new Error(meetingResult.message || 'Failed to load meeting');
      }
      setMeeting(meetingResult.data);

      await loadTranscriptions();

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

  // Load transcriptions from database - FIXED VERSION
  const loadTranscriptions = async () => {
    try {
      console.log('📥 Loading transcriptions from database...');
      
      const transcriptionsResult = await transcriptionService.getTranscriptions(id);
      if (transcriptionsResult.success) {
        const allTranscriptions = transcriptionsResult.data || [];
        
        console.log('✅ Loaded transcriptions:', {
          total: allTranscriptions.length,
          sources: [...new Set(allTranscriptions.map(t => t.source))],
          bySource: allTranscriptions.reduce((acc, t) => {
            acc[t.source] = (acc[t.source] || 0) + 1;
            return acc;
          }, {})
        });

        setTranscriptions(allTranscriptions);
        
        // FIXED: Separate live and whisper transcriptions met alle mogelijke source types
        const liveData = allTranscriptions.filter(t => {
          const source = t.source?.toLowerCase();
          return source === 'live' || 
                 source === 'speech' || 
                 source === 'live_fallback' ||
                 source === 'live_verified';  // ← Dit was missing!
        });
        
        const whisperData = allTranscriptions.filter(t => {
          const source = t.source?.toLowerCase();
          return source === 'whisper' || 
                 source === 'upload' ||      // ← Dit had je al, goed!
                 source === 'whisper_verified';
        });
        
        console.log('📊 Data distribution:', {
          live: liveData.length,
          whisper: whisperData.length,
          liveIds: liveData.map(t => t.id),
          whisperIds: whisperData.map(t => t.id)
        });
        
        setLiveTranscriptions(liveData);
        setWhisperTranscriptions(whisperData);
        
      } else {
        console.warn('Failed to load transcriptions:', transcriptionsResult.message);
      }
    } catch (error) {
      console.error('Error loading transcriptions:', error);
    }
  };

  // Reload transcriptions from database
  const reloadTranscriptions = async () => {
    console.log('🔄 Reloading transcriptions from database...');
    await loadTranscriptions();
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

  // Delete transcriptions with confirmation - UPDATED VERSION
  const handleDeleteTranscriptions = (type) => {
    setDeleteTarget(type);
    setShowDeleteModal(true);
  };

  // FIXED: Delete function that handles all source types
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('🗑️ Starting delete process for:', deleteTarget);
      
      if (deleteTarget === 'live') {
        // Delete live transcriptions from backend - ALL live types
        const liveTypes = ['live', 'speech', 'live_fallback', 'live_verified'];
        
        // Delete each type
        for (const type of liveTypes) {
          try {
            const result = await transcriptionService.deleteTranscriptionsByType(id, type);
            if (result.success) {
              console.log(`✅ Deleted ${type} transcriptions`);
            }
          } catch (error) {
            console.warn(`⚠️ No ${type} transcriptions to delete or error:`, error.message);
          }
        }
        
        console.log('✅ All live transcriptions deleted from database');
        await reloadTranscriptions();
        
      } else if (deleteTarget === 'whisper') {
        // Delete whisper transcriptions from backend - ALL whisper types
        const whisperTypes = ['whisper', 'upload', 'whisper_verified'];
        
        // Delete each type
        for (const type of whisperTypes) {
          try {
            const result = await transcriptionService.deleteTranscriptionsByType(id, type);
            if (result.success) {
              console.log(`✅ Deleted ${type} transcriptions`);
            }
          } catch (error) {
            console.warn(`⚠️ No ${type} transcriptions to delete or error:`, error.message);
          }
        }
        
        console.log('✅ All whisper transcriptions deleted from database');
        await reloadTranscriptions();
        
      } else if (deleteTarget === 'all') {
        // Delete all transcriptions from backend
        const result = await transcriptionService.deleteTranscriptionsByType(id); // No type = all
        
        if (result.success) {
          console.log('✅ All transcriptions deleted from database');
          // Clear all local state
          setLiveTranscriptions([]);
          setWhisperTranscriptions([]);
          setTranscriptions([]);
        } else {
          console.error('Failed to delete all transcriptions:', result.message);
          alert('Fout bij verwijderen van alle transcripties: ' + result.message);
        }
      }
      
    } catch (error) {
      console.error('Error during delete:', error);
      alert('Er is een fout opgetreden bij het verwijderen: ' + error.message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Transcription handlers - UPDATED to handle real data
  const handleLiveTranscriptionReceived = (transcriptionData) => {
    console.log('📝 Live transcription received:', transcriptionData);
    
    // Add to live transcriptions immediately for real-time display
    const newTranscription = {
      ...transcriptionData,
      id: transcriptionData.id || `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: transcriptionData.source || 'live',
      timestamp: transcriptionData.timestamp || new Date(),
      panel: 'live'
    };

    setLiveTranscriptions(prev => [...prev, newTranscription]);
    
    // Also add to main transcriptions array
    setTranscriptions(prev => [...prev, newTranscription]);
    
    // Handle through meeting handlers for additional processing
    if (handlers.handleTranscriptionReceived) {
      handlers.handleTranscriptionReceived(newTranscription);
    }
  };

  const handleWhisperTranscriptionReceived = (transcriptionData) => {
    console.log('🤖 Whisper transcription received:', transcriptionData);
    
    // Add to whisper transcriptions immediately for real-time display
    const newTranscription = {
      ...transcriptionData,
      id: transcriptionData.id || `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: transcriptionData.source || 'whisper',
      timestamp: transcriptionData.timestamp || new Date(),
      panel: 'whisper'
    };

    setWhisperTranscriptions(prev => [...prev, newTranscription]);
    
    // Also add to main transcriptions array
    setTranscriptions(prev => [...prev, newTranscription]);
    
    // Handle through meeting handlers for additional processing
    if (handlers.handleTranscriptionReceived) {
      handlers.handleTranscriptionReceived(newTranscription);
    }
  };

  // Agenda functions
  const toggleAgendaItem = (index) => {
    const updatedMeeting = { ...meeting };
    if (updatedMeeting.agenda_items && updatedMeeting.agenda_items[index]) {
      updatedMeeting.agenda_items[index].completed = !updatedMeeting.agenda_items[index].completed;
      setMeeting(updatedMeeting);
      
      // TODO: Save agenda progress to backend
      console.log('📋 Agenda item toggled:', index, updatedMeeting.agenda_items[index].completed);
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
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
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
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
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
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Transcripties verwijderen"
        message={`Weet je zeker dat je ${
          deleteTarget === 'live' ? 'live transcripties' : 
          deleteTarget === 'whisper' ? 'whisper transcripties' : 
          'alle transcripties'
        } wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.`}
        isLoading={isDeleting}
      />

      {/* Header */}
      <MeetingHeader
        meeting={meeting}
        isRecording={isRecording}
        recordingTime={recordingTime}
        isAutoTranscriptionActive={isAutoTranscriptionActive}
        onNavigateBack={navigateToMeetings}
        formatTime={formatTime}
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area - 8 kolommen breed */}
          <div className="col-span-8 space-y-6">
            
            {/* 1. Opname Meeting Panel */}
            <RecordingPanel
              isExpanded={expandedPanels.recording}
              onToggle={() => togglePanel('recording')}
              recordingMode={recordingMode}
              onSelectRecordingMode={selectRecordingMode}
              isRecording={isRecording}
              recordingTime={recordingTime}
              recordingStartTime={recordingStartTime}
              onStartManualRecording={startManualRecording}
              onStartAutoTranscription={startAutoTranscription}
              onPauseRecording={pauseRecording}
              onStopRecording={stopRecording}
              onLiveTranscriptionReceived={handleLiveTranscriptionReceived}
              onWhisperTranscriptionReceived={handleWhisperTranscriptionReceived}
              meetingId={id}
              meeting={meeting}
              formatTime={formatTime}
            />

            {/* 2. Live Transcriptie Panel */}
            <LiveTranscriptionPanel
              isExpanded={expandedPanels.liveTranscription}
              onToggle={() => togglePanel('liveTranscription')}
              liveTranscriptions={liveTranscriptions}
              isAutoTranscriptionActive={isAutoTranscriptionActive}
              onDeleteTranscriptions={handleDeleteTranscriptions}
              isDeleting={isDeleting && deleteTarget === 'live'}
            />

            {/* 3. Whisper Transcriptie Panel */}
            <WhisperTranscriptionPanel
              isExpanded={expandedPanels.whisperTranscription}
              onToggle={() => togglePanel('whisperTranscription')}
              whisperTranscriptions={whisperTranscriptions}
              onDeleteTranscriptions={handleDeleteTranscriptions}
              isDeleting={isDeleting && deleteTarget === 'whisper'}
            />
          </div>

          {/* Sidebar - 4 kolommen breed */}
          <div className="col-span-4 space-y-6">
            
            {/* 4. Agenda Panel */}
            <AgendaPanel
              isExpanded={expandedPanels.agenda}
              onToggle={() => togglePanel('agenda')}
              meeting={meeting}
              currentAgendaIndex={currentAgendaIndex}
              onToggleAgendaItem={toggleAgendaItem}
              calculateAgendaProgress={calculateAgendaProgress}
            />

            {/* 5. Verslag Panel */}
            <ReportPanel
              isExpanded={expandedPanels.report}
              onToggle={() => togglePanel('report')}
              reportData={reportData}
              setReportData={setReportData}
              recordingTime={recordingTime}
              liveTranscriptions={liveTranscriptions}
              whisperTranscriptions={whisperTranscriptions}
              meeting={meeting}
              formatTime={formatTime}
            />

            {/* 6. Privacy Panel */}
            <PrivacyPanel
              isExpanded={expandedPanels.privacy}
              onToggle={() => togglePanel('privacy')}
              privacyData={privacyData}
            />

            {/* 7. Speaker Panel */}
            <SpeakerPanel
              availableSpeakers={availableSpeakers}
              currentSpeaker={currentSpeaker}
              onSpeakerChange={handlers.handleSpeakerChange}
            />
          </div>
        </div>
      </div>

      {/* Debug Panel - VERWIJDER DIT IN PRODUCTIE */}
      <DebugPanel
        transcriptions={transcriptions}
        liveTranscriptions={liveTranscriptions}
        whisperTranscriptions={whisperTranscriptions}
      />
    </div>
  );
};

export default MeetingRoom;