// Utility functions voor MeetingRoom components

// Speaker kleuren voor consistentie
export const getSpeakerColor = (index) => {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#F59E0B', // yellow-500
    '#EF4444', // red-500
    '#8B5CF6', // purple-500
    '#F97316', // orange-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#EC4899', // pink-500
    '#6B7280'  // gray-500
  ];
  return colors[index % colors.length];
};

// Format timestamp voor weergave
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Nu';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Nu';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 1) {
    return 'Nu';
  } else if (diffMins < 60) {
    return `${diffMins} min geleden`;
  } else if (diffHours < 24) {
    return `${diffHours} uur geleden`;
  } else {
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Format tijd in MM:SS formaat
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Valideer transcriptie data
export const validateTranscriptionData = (data) => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  return Boolean(data.text && data.speaker);
};

// Genereer unieke ID voor transcripties
export const generateTranscriptionId = (prefix = 'trans') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Sorteer transcripties op timestamp
export const sortTranscriptionsByTime = (transcriptions) => {
  return [...transcriptions].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0);
    const timeB = new Date(b.timestamp || 0);
    return timeA - timeB;
  });
};

// Filter transcripties op bron
export const filterTranscriptionsBySource = (transcriptions, source) => {
  return transcriptions.filter(t => t.source === source);
};

// Bereken totale spreektijd per spreker
export const calculateSpeakerStats = (transcriptions) => {
  const stats = {};
  
  transcriptions.forEach(transcription => {
    const speaker = transcription.speaker || transcription.speaker_name || 'Unknown';
    if (!stats[speaker]) {
      stats[speaker] = {
        totalTime: 0,
        segments: 0,
        words: 0
      };
    }
    
    stats[speaker].segments += 1;
    stats[speaker].words += (transcription.text || '').split(' ').length;
    
    // Geschatte spreektijd op basis van woordaantal (gemiddeld 150 woorden per minuut)
    const estimatedTime = (transcription.text || '').split(' ').length / 150 * 60;
    stats[speaker].totalTime += estimatedTime;
  });
  
  return stats;
};

// Zoek in transcripties
export const searchTranscriptions = (transcriptions, query) => {
  if (!query || query.trim() === '') {
    return transcriptions;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return transcriptions.filter(transcription => {
    const text = (transcription.text || '').toLowerCase();
    const speaker = (transcription.speaker || transcription.speaker_name || '').toLowerCase();
    
    return text.includes(searchTerm) || speaker.includes(searchTerm);
  });
};

// Export all utilities as default object
export default {
  getSpeakerColor,
  formatTimestamp,
  formatTime,
  validateTranscriptionData,
  generateTranscriptionId,
  sortTranscriptionsByTime,
  filterTranscriptionsBySource,
  calculateSpeakerStats,
  searchTranscriptions
};