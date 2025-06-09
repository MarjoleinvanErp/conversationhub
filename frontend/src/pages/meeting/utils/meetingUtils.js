// Meeting utility functions

/**
 * Generate speaker color based on index
 */
export const getSpeakerColor = (index) => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green  
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];
  
  return colors[index % colors.length];
};

/**
 * Format speaking time duration
 */
export const formatSpeakingTime = (seconds) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Calculate agenda progress percentage
 */
export const calculateAgendaProgress = (agendaItems, currentIndex) => {
  if (!agendaItems || agendaItems.length === 0) return 0;
  return Math.round((currentIndex / agendaItems.length) * 100);
};

/**
 * Get next agenda item
 */
export const getNextAgendaItem = (agendaItems, currentIndex) => {
  if (!agendaItems || currentIndex >= agendaItems.length - 1) return null;
  return agendaItems[currentIndex + 1];
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Find speaker by ID
 */
export const findSpeakerById = (speakers, speakerId) => {
  return speakers.find(speaker => speaker.id === speakerId) || null;
};

/**
 * Update speaker stats
 */
export const updateSpeakerStats = (currentStats, speakerId, duration = 1) => {
  const newStats = { ...currentStats };
  
  if (!newStats[speakerId]) {
    newStats[speakerId] = { totalTime: 0, segments: 0 };
  }
  
  newStats[speakerId].totalTime += duration;
  newStats[speakerId].segments += 1;
  
  return newStats;
};

/**
 * Generate unique speaker ID
 */
export const generateSpeakerId = (name) => {
  return `speaker_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
};

/**
 * Validate transcription text
 */
export const validateTranscriptionText = (text) => {
  if (!text || typeof text !== 'string') return false;
  return text.trim().length > 0;
};