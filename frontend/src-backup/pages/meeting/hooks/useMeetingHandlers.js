import { useCallback } from 'react';
import transcriptionService from '../../../services/api/transcriptionService.js';
import { 
  validateTranscriptionText, 
  updateSpeakerStats, 
  generateSpeakerId 
} from '../utils/meetingUtils.js';

export const useMeetingHandlers = ({
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
}) => {

  // Handle new transcription from audio components
  const handleTranscriptionReceived = useCallback((transcriptionData) => {
    console.log('📝 New transcription received:', transcriptionData);
    
    if (!validateTranscriptionText(transcriptionData.text)) {
      console.warn('Invalid transcription text received');
      return;
    }

    const newTranscription = {
      id: `transcription_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: transcriptionData.text.trim(),
      timestamp: transcriptionData.timestamp || new Date(),
      speaker: transcriptionData.speaker || currentSpeaker?.displayName || 'Onbekende Spreker',
      speakerId: transcriptionData.speakerId || currentSpeaker?.id || 'unknown_speaker',
      speakerColor: transcriptionData.speakerColor || currentSpeaker?.color || '#6B7280',
      confidence: transcriptionData.confidence || 0.8,
      isFinal: transcriptionData.isFinal !== false,
      processingStatus: transcriptionData.processingStatus || 'live',
      source: transcriptionData.source || 'live'
    };

    // Add to local state immediately for responsiveness
    setTranscriptions(prev => [...prev, newTranscription]);

    // Update speaker stats
    if (newTranscription.speakerId) {
      setSpeakerStats(prev => 
        updateSpeakerStats(prev, newTranscription.speakerId, transcriptionData.duration || 1)
      );
    }

    // Save to database
    saveTranscriptionToDatabase(newTranscription);
  }, [currentSpeaker, setTranscriptions, setSpeakerStats]);

// Save transcription to database
const saveTranscriptionToDatabase = useCallback(async (transcription) => {
  try {
    console.log('💾 Saving transcription to database:', transcription);

    const dbData = {
      meeting_id: parseInt(id),
      speaker_name: transcription.speaker || 'Audio Upload',
      speaker_id: transcription.speakerId || 'audio_upload',
      speaker_color: transcription.speakerColor || '#6B7280',
      text: transcription.text,
      confidence: transcription.confidence || 0.8,
      source: 'upload',
      is_final: true,
      spoken_at: new Date().toISOString(),
    };

    console.log('💾 Database payload:', dbData);

    const result = await transcriptionService.saveTranscription(dbData);
    
    if (result.success) {
      // Update local transcription with database ID
      setTranscriptions(prev => prev.map(t => 
        t.id === transcription.id 
          ? { ...t, dbId: result.data.id, saved: true }
          : t
      ));
      console.log('✅ Transcription saved to database:', result.data.id);
    } else {
      console.error('❌ Failed to save transcription:', result.message);
      console.error('❌ Validation errors:', result.errors);
    }
  } catch (error) {
    console.error('❌ Error saving transcription:', error);
  }
}, [id, setTranscriptions]);

  // Handle speaker change
  const handleSpeakerChange = useCallback((newSpeaker) => {
    console.log('👤 Speaker changed to:', newSpeaker.displayName);
    
    // Update current speaker
    setCurrentSpeaker(newSpeaker);
    
    // Update speaker activity status
    setAvailableSpeakers(prev => prev.map(speaker => ({
      ...speaker,
      isActive: speaker.id === newSpeaker.id
    })));
  }, [setCurrentSpeaker, setAvailableSpeakers]);

  // Add new speaker dynamically
  const handleAddSpeaker = useCallback((speakerName) => {
    if (!speakerName.trim()) return;

    const newSpeaker = {
      id: generateSpeakerId(speakerName),
      name: speakerName.trim(),
      displayName: speakerName.trim(),
      role: 'dynamic',
      color: getSpeakerColor(availableSpeakers.length),
      totalSpeakingTime: 0,
      segmentCount: 0,
      isActive: false,
      isParticipant: false
    };

    setAvailableSpeakers(prev => [...prev, newSpeaker]);
    
    // Initialize stats for new speaker
    setSpeakerStats(prev => ({
      ...prev,
      [newSpeaker.id]: { totalTime: 0, segments: 0 }
    }));

    console.log('➕ New speaker added:', newSpeaker.displayName);
    return newSpeaker;
  }, [availableSpeakers.length, setAvailableSpeakers, setSpeakerStats]);

  // Handle agenda navigation
  const handleNextAgendaItem = useCallback(() => {
    if (!meeting?.agenda_items || currentAgendaIndex >= meeting.agenda_items.length - 1) {
      return;
    }

    const nextIndex = currentAgendaIndex + 1;
    setCurrentAgendaIndex(nextIndex);
    
    // Mark start time for new agenda item
    setAgendaStartTimes(prev => ({
      ...prev,
      [nextIndex]: new Date()
    }));

    console.log(`📋 Moved to agenda item ${nextIndex + 1}:`, meeting.agenda_items[nextIndex].title);
  }, [meeting, currentAgendaIndex, setCurrentAgendaIndex, setAgendaStartTimes]);

  const handlePreviousAgendaItem = useCallback(() => {
    if (currentAgendaIndex <= 0) return;

    const prevIndex = currentAgendaIndex - 1;
    setCurrentAgendaIndex(prevIndex);
    
    console.log(`📋 Moved back to agenda item ${prevIndex + 1}:`, meeting.agenda_items[prevIndex].title);
  }, [currentAgendaIndex, setCurrentAgendaIndex, meeting]);

  const handleGoToAgendaItem = useCallback((index) => {
    if (!meeting?.agenda_items || index < 0 || index >= meeting.agenda_items.length) {
      return;
    }

    setCurrentAgendaIndex(index);
    
    // Mark start time if not already set
    setAgendaStartTimes(prev => ({
      ...prev,
      [index]: prev[index] || new Date()
    }));

    console.log(`📋 Jumped to agenda item ${index + 1}:`, meeting.agenda_items[index].title);
  }, [meeting, setCurrentAgendaIndex, setAgendaStartTimes]);

  // Handle session stats update
  const handleSessionStatsUpdate = useCallback((stats) => {
    console.log('📊 Session stats updated:', stats);
    // Here you could update any session-level statistics
    // For now, we just log them
  }, []);

  // Update transcription (for editing)
  const handleUpdateTranscription = useCallback(async (transcriptionId, updates) => {
    try {
      const result = await transcriptionService.updateTranscription(transcriptionId, updates);
      
      if (result.success) {
        setTranscriptions(prev => prev.map(t => 
          t.dbId === transcriptionId 
            ? { ...t, ...updates, updated: true }
            : t
        ));
        console.log('✅ Transcription updated:', transcriptionId);
      } else {
        console.error('Failed to update transcription:', result.message);
      }
    } catch (error) {
      console.error('Error updating transcription:', error);
    }
  }, [setTranscriptions]);

  // Delete transcription
  const handleDeleteTranscription = useCallback(async (transcriptionId) => {
    try {
      const result = await transcriptionService.deleteTranscription(transcriptionId);
      
      if (result.success) {
        setTranscriptions(prev => prev.filter(t => t.dbId !== transcriptionId));
        console.log('🗑️ Transcription deleted:', transcriptionId);
      } else {
        console.error('Failed to delete transcription:', result.message);
      }
    } catch (error) {
      console.error('Error deleting transcription:', error);
    }
  }, [setTranscriptions]);

  return {
    handleTranscriptionReceived,
    handleSpeakerChange,
    handleAddSpeaker,
    handleNextAgendaItem,
    handlePreviousAgendaItem,
    handleGoToAgendaItem,
    handleSessionStatsUpdate,
    handleUpdateTranscription,
    handleDeleteTranscription,
  };
};