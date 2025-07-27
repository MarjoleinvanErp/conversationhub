import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';
import transcriptionService from '../../services/api/transcriptionService.js';
import enhancedLiveTranscriptionService from '../../services/api/enhancedLiveTranscriptionService.js';
import { agendaService } from '../../services/agendaService';
import { useMeetingHandlers } from './hooks/useMeetingHandlers.js';
import { getSpeakerColor } from './utils/meetingUtils.js';
import MeetingRoomTabs from './components/MeetingRoomTabs.jsx';

// Import alle components
import {
  MeetingHeader,
  LiveTranscriptionPanel,
  WhisperTranscriptionPanel,
  AgendaPanel,
  ReportPanel,
  PrivacyPanel,
  SpeakerPanel,
  ConfirmationModal
} from '../../components/meeting/MeetingRoom/index.js';

// Import icons voor FloatingButtons
import { Download, Send } from '../../components/meeting/MeetingRoom/Icons.jsx';

const FloatingButtons = ({ 
  meetingId, 
  meeting, 
  isLoading = false,
  onDownloadRawData,
  onN8NTrigger,
  n8nButtonState = 'idle' // NEW PROP
}) => {
  
  // Define button appearance based on state
  const getN8NButtonClass = () => {
    const baseClass = "text-white px-4 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2";
    
    switch (n8nButtonState) {
      case 'loading':
        return `${baseClass} bg-yellow-600 cursor-wait`;
      case 'success':
        return `${baseClass} bg-green-600 hover:bg-green-700`;
      case 'error':
        return `${baseClass} bg-red-600 hover:bg-red-700`;
      default:
        return `${baseClass} bg-green-600 hover:bg-green-700`;
    }
  };

  const getN8NButtonText = () => {
    switch (n8nButtonState) {
      case 'loading':
        return 'Versturen...';
      case 'success':
        return 'Verstuurd!';
      case 'error':
        return 'Probeer opnieuw';
      default:
        return 'Verslag';
    }
  };

  const getN8NButtonIcon = () => {
    switch (n8nButtonState) {
      case 'loading':
        return <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>;
      case 'error':
        return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>;
      default:
        return <Send className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
      {/* Download Raw Data Button */}
      <button
        onClick={onDownloadRawData}
        disabled={isLoading}
        className={`bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center space-x-2 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Download ruwe data"
      >
        <Download className="w-5 h-5" />
        <span className="text-sm font-medium">Ruwe Data</span>
      </button>

      {/* N8N Report Button - UPDATED met visuele feedback */}
      <button
        type="button"
        onClick={onN8NTrigger}
        disabled={isLoading || n8nButtonState === 'loading'}
        className={getN8NButtonClass()}
        title={n8nButtonState === 'loading' ? 'Wordt verstuurd naar N8N...' : 'Genereer verslag via N8N'}
      >
        {getN8NButtonIcon()}
        <span className="text-sm font-medium">{getN8NButtonText()}</span>
      </button>
    </div>
  );
};

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log('🔄 MeetingRoom component rendering, ID:', id, 'Time:', new Date().toLocaleTimeString());

  const loadingRef = useRef(false);
  const loadedIdRef = useRef(null);

  // FEATURE FLAGS - Zet deze op false om panels te verbergen
  const SHOW_LIVE_TRANSCRIPTION_PANEL = false; // <- Zet op true om weer te tonen
  const SHOW_WHISPER_TRANSCRIPTION_PANEL = true;
  const SHOW_RECORDING_PANEL = true;

  // Basic states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meeting, setMeeting] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [liveTranscriptions, setLiveTranscriptions] = useState([]);
  const [whisperTranscriptions, setWhisperTranscriptions] = useState([]);
  const [n8nButtonState, setN8nButtonState] = useState('idle'); // NEW STATE

  // Panel states
  const [expandedPanels, setExpandedPanels] = useState({
    recording: true,
    liveTranscription: false,
    whisperTranscription: false,
    agenda: false,
    report: false,
    privacy: false,
    speaker: false
  });

  // NEW: Refresh states per panel
  const [refreshingPanels, setRefreshingPanels] = useState({
    recording: false,
    liveTranscription: false,
    whisperTranscription: false,
    agenda: false,
    report: false,
    privacy: false,
    speaker: false
  });

  // Recording states
  const [recordingMode, setRecordingMode] = useState('automatic');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [isAutoTranscriptionActive, setIsAutoTranscriptionActive] = useState(false);

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Speaker states
  const [currentSpeaker, setCurrentSpeaker] = useState('');
  const [availableSpeakers, setAvailableSpeakers] = useState([]);
  const [speakerStats, setSpeakerStats] = useState({});

  // Agenda states
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [agendaStartTimes, setAgendaStartTimes] = useState({});

  // Report states
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

  // Load meeting data on mount
useEffect(() => {
  console.log('🎯 useEffect triggered for ID:', id, 'Already loading:', loadingRef.current);
  
  // Prevent duplicate calls
  if (id && !loadingRef.current && loadedIdRef.current !== id) {
    loadingRef.current = true;
    loadedIdRef.current = id;
    loadMeetingData();
  }
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

  // Function to refresh meeting data
  const fetchMeetingData = async () => {
    try {
      const response = await meetingService.getMeeting(id);
      if (response.success) {
        setMeeting(response.data);
      }
    } catch (error) {
      console.error('Error fetching meeting data:', error);
    }
  };

  // NEW: Agenda-specific refresh function (lightweight)
  const refreshAgendaData = useCallback(async () => {
    if (!meeting?.id) return;
    
    setRefreshingPanels(prev => ({ ...prev, agenda: true }));
    
    try {
      console.log('🔄 Refreshing agenda data only...');
      
      // Fetch only agenda items instead of full meeting
      const agendaResponse = await agendaService.getAgendaItems(meeting.id);
      
      if (agendaResponse && agendaResponse.success) {
        // Update only the agenda_items in the meeting state
        setMeeting(prevMeeting => ({
          ...prevMeeting,
          agenda_items: agendaResponse.data
        }));
        
        console.log('✅ Agenda data refreshed successfully');
      } else {
        console.error('❌ Failed to refresh agenda data:', agendaResponse?.message || 'Unknown error');
        setError(`Fout bij verversen agenda: ${agendaResponse?.message || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('❌ Error refreshing agenda data:', error);
      setError(`Fout bij verversen agenda: ${error.message}`);
    } finally {
      setRefreshingPanels(prev => ({ ...prev, agenda: false }));
    }
  }, [meeting?.id, setMeeting, setRefreshingPanels]);

  // Handle Whisper updates from EnhancedLiveTranscription
  const handleWhisperUpdate = (updateData) => {
    console.log('🤖 Meeting room received Whisper update:', updateData);
    
    if (updateData.type === 'transcription_completed' && updateData.transcription) {
      // Add to local state for immediate display
      setWhisperTranscriptions(prev => {
        // Check if already exists
        const exists = prev.some(t => t.id === updateData.transcription.id);
        if (!exists) {
          return [updateData.transcription, ...prev].slice(0, 50); // Keep latest 50
        }
        return prev;
      });
    }
  };

  // NEW: Main refresh function per panel
  const refreshPanelData = async (panelType, freshData = null) => {
    console.log(`🔄 Refreshing ${panelType} panel...`);
    
    setRefreshingPanels(prev => ({
      ...prev,
      [panelType]: true
    }));

    try {
      switch (panelType) {
        case 'recording':
          // Refresh meeting basis data
          await fetchMeetingData();
          break;
          
        case 'liveTranscription':
          // Refresh alleen live transcripties
          await refreshLiveTranscriptions();
          break;
          
        case 'whisperTranscription':
          if (freshData) {
            // Use provided fresh data
            setWhisperTranscriptions(freshData);
            // Update combined transcriptions
            setTranscriptions(prev => [
              ...prev.filter(t => !['whisper', 'whisper_verified', 'background_whisper'].includes(t.source)),
              ...freshData
            ]);
          } else {
            // Fetch from API
            await refreshWhisperTranscriptions();
          }
          break;
          
        case 'agenda':
          // Use dedicated agenda refresh instead of full meeting refresh
          await refreshAgendaData();
          break;
          
        case 'report':
          // Refresh alle transcripties voor report
          await refreshAllTranscriptions();
          break;
          
        case 'privacy':
          // Refresh privacy data
          await refreshAllTranscriptions();
          break;
          
        case 'speaker':
          // Refresh speaker data
          await refreshAllTranscriptions();
          break;
          
        default:
          console.warn(`Unknown panel type: ${panelType}`);
      }
      
      console.log(`✅ ${panelType} panel refreshed successfully`);
      
    } catch (error) {
      console.error(`❌ Error refreshing ${panelType} panel:`, error);
      setError(`Fout bij verversen ${panelType} panel: ${error.message}`);
      
    } finally {
      setRefreshingPanels(prev => ({
        ...prev,
        [panelType]: false
      }));
    }
  };

  // NEW: Specific refresh functions
  const refreshLiveTranscriptions = async () => {
    try {
      const response = await transcriptionService.getTranscriptions(id, 'live');
      if (response.success) {
        setLiveTranscriptions(response.data || []);
        // Update combined transcriptions
        setTranscriptions(prev => [
          ...prev.filter(t => t.source !== 'live'),
          ...(response.data || [])
        ]);
      }
    } catch (error) {
      console.error('Error refreshing live transcriptions:', error);
      throw error;
    }
  };

  const refreshWhisperTranscriptions = async () => {
    try {
      console.log('🔄 Refreshing Whisper transcriptions...');
      
      const result = await enhancedLiveTranscriptionService.getWhisperTranscriptions(id);
      
      if (result.success) {
        setWhisperTranscriptions(result.transcriptions);
        // Update combined transcriptions
        setTranscriptions(prev => [
          ...prev.filter(t => !['whisper', 'whisper_verified', 'background_whisper'].includes(t.source)),
          ...result.transcriptions
        ]);
        
        console.log('✅ Whisper transcriptions refreshed:', result.transcriptions.length);
      } else {
        console.error('❌ Failed to refresh Whisper transcriptions:', result.error);
      }
    } catch (error) {
      console.error('❌ Whisper refresh error:', error);
      throw error;
    }
  };

  const refreshAllTranscriptions = async () => {
    try {
      const [liveResponse, whisperResponse] = await Promise.all([
        transcriptionService.getTranscriptions(id, 'live'),
        enhancedLiveTranscriptionService.getWhisperTranscriptions(id)
      ]);
      
      if (liveResponse.success) {
        setLiveTranscriptions(liveResponse.data || []);
      }
      if (whisperResponse.success) {
        setWhisperTranscriptions(whisperResponse.transcriptions || []);
      }
      
      // Update combined transcriptions
      const allTranscriptions = [
        ...(liveResponse.data || []),
        ...(whisperResponse.transcriptions || [])
      ];
      setTranscriptions(allTranscriptions);
      
    } catch (error) {
      console.error('Error refreshing all transcriptions:', error);
      throw error;
    }
  };


// Load meeting and transcription data (OPTIMIZED)
const loadMeetingData = async () => {
  console.log('🚀 loadMeetingData CALLED at:', new Date().toLocaleTimeString());
  
  try {
    setLoading(true);
    setError('');

    console.log('📥 Loading meeting data for ID:', id);

    // Load meeting data ONLY (no duplicate calls)
    const meetingResult = await meetingService.getMeeting(id);
    if (!meetingResult.success) {
      throw new Error(meetingResult.message || 'Fout bij ophalen meeting');
    }

    setMeeting(meetingResult.data);
    console.log('✅ Meeting loaded:', meetingResult.data);

    // Load transcriptions ONLY ONCE
    console.log('📥 Loading transcriptions...');
    const transcriptionsResult = await transcriptionService.getTranscriptions(id);
    
    if (transcriptionsResult.success) {
      const allTranscriptions = transcriptionsResult.data || [];
      
      // Separate transcriptions by source
      const live = allTranscriptions.filter(t => t.source === 'live');
      const whisper = allTranscriptions.filter(t => ['whisper', 'whisper_verified', 'background_whisper'].includes(t.source));
      
      setTranscriptions(allTranscriptions);
      setLiveTranscriptions(live);
      setWhisperTranscriptions(whisper);
      
      console.log('✅ Transcriptions loaded:', {
        total: allTranscriptions.length,
        live: live.length,
        whisper: whisper.length
      });
    } else {
      console.warn('⚠️ Transcriptions not loaded:', transcriptionsResult.message);
    }

    // REMOVED: Extra Whisper refresh call
    // REMOVED: Auto-refresh timeout
    console.log('✅ Initial data loading complete');

  } catch (error) {
    console.error('❌ Error loading meeting data:', error);
    setError(error.message || 'Er ging iets mis bij het laden van de meeting');
  } finally {
    setLoading(false);
    loadingRef.current = false; // ADD THIS
  }
};




  const setupSpeakers = () => {
    if (meeting?.participants) {
      const speakers = meeting.participants.map(p => p.name || p.role || 'Onbekend');
      setAvailableSpeakers(['Onbekend', ...speakers]);
      setCurrentSpeaker(speakers[0] || 'Onbekend');
    }
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
    setExpandedPanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // Recording functions
  const selectRecordingMode = (mode) => {
    setRecordingMode(mode);
    console.log('Recording mode selected:', mode);
  };

  const startManualRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(new Date());
    setExpandedPanels(prev => ({ ...prev, liveTranscription: true }));
    console.log('Manual recording started');
  };

  const startAutoTranscription = () => {
    setIsAutoTranscriptionActive(true);
    setExpandedPanels(prev => ({ ...prev, liveTranscription: true }));
    console.log('Auto transcription started');
  };

  const pauseRecording = () => {
    setIsRecording(false);
    console.log('Recording paused');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsAutoTranscriptionActive(false);
    setRecordingTime(0);
    setRecordingStartTime(null);
    console.log('Recording stopped');
  };

  // Transcription handlers
  const handleLiveTranscriptionReceived = (transcription) => {
    console.log('Live transcription received:', transcription);
    setLiveTranscriptions(prev => [...prev, transcription]);
    setTranscriptions(prev => [...prev, transcription]);
  };

  const handleWhisperTranscriptionReceived = (transcription) => {
    console.log('Whisper transcription received:', transcription);
    setWhisperTranscriptions(prev => [...prev, transcription]);
    setTranscriptions(prev => [...prev, transcription]);
  };

// FIXED Delete handlers - WITH API CALL
  const handleDeleteTranscriptions = (type) => {
    console.log(`🗑️ Delete requested for type: ${type}`);
    setDeleteTarget(type);
    setShowDeleteModal(true);
  };

  const confirmDeleteTranscriptions = async () => {
    try {
      setIsDeleting(true);
      
      console.log(`🗑️ Starting delete process for ${deleteTarget} transcriptions (meeting ${id})...`);
      
      // Call the API to delete from database
      const deleteResult = await transcriptionService.deleteTranscriptionsByType(id, deleteTarget);
      
      if (!deleteResult.success) {
        throw new Error(deleteResult.message || 'Failed to delete transcriptions from database');
      }
      
      console.log(`✅ Successfully deleted ${deleteResult.data?.deleted_count || 0} ${deleteTarget} transcriptions from database`);
      
      // Update UI state ONLY after successful API call
      if (deleteTarget === 'live') {
        setLiveTranscriptions([]);
        setTranscriptions(prev => prev.filter(t => 
          !['live', 'live_fallback', 'background_live'].includes(t.source)
        ));
        console.log('🔄 UI updated: Live transcriptions cleared');
      } else if (deleteTarget === 'whisper') {
        setWhisperTranscriptions([]);
        setTranscriptions(prev => prev.filter(t => 
          !['whisper', 'whisper_verified', 'background_whisper'].includes(t.source)
        ));
        console.log('🔄 UI updated: Whisper transcriptions cleared');
      }
      
      // Clear any error messages
      setError('');
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteTarget('');
      
      console.log(`✅ Delete process completed successfully for ${deleteTarget} type`);
      
    } catch (error) {
      console.error(`❌ Error deleting ${deleteTarget} transcriptions:`, error);
      setError(`Fout bij verwijderen ${deleteTarget} transcripties: ${error.message}`);
      
      // Keep modal open so user can try again or cancel
    } finally {
      setIsDeleting(false);
    }
  };

  // Agenda functions
  const toggleAgendaItem = (index) => {
    console.log('Toggle agenda item:', index);
    // Implementation depends on your agenda logic
  };

  const calculateAgendaProgress = () => {
    if (!meeting?.agenda_items) return 0;
    const completed = meeting.agenda_items.filter(item => item.completed || item.status === 'completed').length;
    return Math.round((completed / meeting.agenda_items.length) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-gray-700">Meeting wordt geladen...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200 max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Fout bij laden meeting</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-3">
              <button 
                onClick={() => loadMeetingData()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Opnieuw proberen
              </button>
              <button 
                onClick={() => navigate('/meetings')}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Terug naar overzicht
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MeetingHeader 
        meeting={meeting}
        onNavigateBack={() => navigate('/meetings')}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Main Panels (8 columns) */}
          <div className="col-span-8 space-y-6">

            {/* 1. Meeting Room Tabs met AutoRecordingPanel */}
            <MeetingRoomTabs
              meeting={meeting}
              onUpdateMeeting={setMeeting}
              currentAgendaIndex={currentAgendaIndex}
              agendaStartTimes={agendaStartTimes}
              transcriptionData={liveTranscriptions}
              whisperData={whisperTranscriptions}
            />            

            {/* 2. Report Panel - MOVED FROM SIDEBAR TO MAIN COLUMN */}
<ReportPanel
  meetingId={id}
  meeting={meeting}
  isExpanded={expandedPanels.report}
  onToggle={() => togglePanel('report')}
  onRefresh={refreshPanelData}
  isRefreshing={refreshingPanels.report}
/>

            {/* 3. Live Transcription Panel - CONDITIONAL RENDERING */}
            {SHOW_LIVE_TRANSCRIPTION_PANEL && (
              <LiveTranscriptionPanel
                isExpanded={expandedPanels.liveTranscription}
                onToggle={() => togglePanel('liveTranscription')}
                liveTranscriptions={liveTranscriptions}
                isAutoTranscriptionActive={isAutoTranscriptionActive}
                onDeleteTranscriptions={handleDeleteTranscriptions}
                isDeleting={isDeleting && deleteTarget === 'live'}
                onRefresh={refreshPanelData}
                isRefreshing={refreshingPanels.liveTranscription}
              />
            )}

            {/* 4. Whisper Transcription Panel - CONDITIONAL RENDERING */}
            {SHOW_WHISPER_TRANSCRIPTION_PANEL && (
              <WhisperTranscriptionPanel
                isExpanded={expandedPanels.whisperTranscription}
                onToggle={() => togglePanel('whisperTranscription')}
                whisperTranscriptions={whisperTranscriptions}
                onDeleteTranscriptions={handleDeleteTranscriptions}
                isDeleting={isDeleting && deleteTarget === 'whisper'}
                meetingId={id} // ADDED
                onRefresh={refreshPanelData}
                isRefreshing={refreshingPanels.whisperTranscription}
              />
            )}
          </div>

          {/* Right Column - Sidebar Panels (4 columns) */}
          <div className="col-span-4 space-y-6">
            
            {/* 1. Agenda Panel - UPDATED WITH NEW PROPS */}
            <AgendaPanel
              key={meeting?.agendaItems?.length || meeting?.agenda_items?.length || 0}
              isExpanded={expandedPanels.agenda}
              onToggle={() => togglePanel('agenda')}
              meeting={meeting}
              setMeeting={setMeeting}
              currentAgendaIndex={currentAgendaIndex}
              onToggleAgendaItem={toggleAgendaItem}
              calculateAgendaProgress={calculateAgendaProgress}
              onAgendaRefresh={refreshAgendaData}
              isRefreshing={refreshingPanels.agenda}
            />

            {/* 2. Privacy Panel */}
            <PrivacyPanel
              isExpanded={expandedPanels.privacy}
              onToggle={() => togglePanel('privacy')}
              transcriptions={transcriptions}
              onRefresh={refreshPanelData}
              isRefreshing={refreshingPanels.privacy}
            />

            {/* 3. Speaker Panel */}
            <SpeakerPanel
              isExpanded={expandedPanels.speaker}
              onToggle={() => togglePanel('speaker')}
              currentSpeaker={currentSpeaker}
              setCurrentSpeaker={setCurrentSpeaker}
              availableSpeakers={availableSpeakers}
              setAvailableSpeakers={setAvailableSpeakers}
              speakerStats={speakerStats}
              getSpeakerColor={getSpeakerColor}
              onRefresh={refreshPanelData}
              isRefreshing={refreshingPanels.speaker}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteTranscriptions}
          title="Transcripties verwijderen"
          message={`Weet je zeker dat je alle ${deleteTarget === 'live' ? 'live' : 'Whisper'} transcripties wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.`}
          confirmText="Verwijderen"
          cancelText="Annuleren"
          type="danger"
          isLoading={isDeleting}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingButtons
        meetingId={id}
        meeting={meeting}
        isLoading={refreshingPanels.report || loading}
        n8nButtonState={n8nButtonState} // NEW PROP
        onDownloadRawData={() => {
          // Implementeer download raw data functionaliteit
          if (!id) {
            alert('Meeting ID niet beschikbaar');
            return;
          }

          const mockData = {
            meeting: {
              id: id,
              title: meeting?.title || 'Onbekend',
              status: meeting?.status || 'onbekend',
              participants: meeting?.participants || [],
              liveTranscriptions: liveTranscriptions,
              whisperTranscriptions: whisperTranscriptions,
              recordingTime: recordingTime
            },
            exported_at: new Date().toISOString()
          };

          const jsonData = JSON.stringify(mockData, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `meeting-${id}-data-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
        onN8NTrigger={(event) => {
          event?.preventDefault();
          
          if (!id || n8nButtonState === 'loading') return; // Prevent multiple clicks
          
          setN8nButtonState('loading'); // Show loading state
          
          fetch(`http://localhost:8000/api/n8n/trigger-meeting-completed/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          .then(response => response.json())
          .then(result => {
            console.log('N8N triggered:', result.success ? '✅' : '❌', result);
            
            if (result.success) {
              setN8nButtonState('success');
              // Reset to idle after 2 seconds
              setTimeout(() => setN8nButtonState('idle'), 2000);
            } else {
              setN8nButtonState('error');
              setTimeout(() => setN8nButtonState('idle'), 3000);
            }
          })
          .catch(error => {
            console.error('N8N error:', error);
            setN8nButtonState('error');
            setTimeout(() => setN8nButtonState('idle'), 3000);
          });
        }}
      />
    </div>
  );
};

export default MeetingRoom;