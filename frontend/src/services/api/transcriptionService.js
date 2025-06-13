import authService from './authService';

const API_BASE_URL = 'http://localhost:8000';

class TranscriptionService {
  /**
   * Get all transcriptions for a meeting
   */
  async getTranscriptions(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/transcriptions`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get transcriptions');
      }
      
      return data;
    } catch (error) {
      console.error('Get transcriptions error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Delete transcriptions by type (live, whisper, etc.)
   */
  async deleteTranscriptionsByType(meetingId, type = null) {
    try {
      // If no type specified, delete all transcriptions for the meeting
      const url = type 
        ? `${API_BASE_URL}/api/meetings/${meetingId}/transcriptions/${type}`
        : `${API_BASE_URL}/api/meetings/${meetingId}/transcriptions`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete transcriptions');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Delete transcriptions by type error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Delete single transcription by ID
   */
  async deleteTranscription(transcriptionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcriptions/${transcriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete transcription');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Delete transcription error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Save new transcription
   */
  async saveTranscription(transcriptionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptionData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save transcription');
      }
      
      return data;
    } catch (error) {
      console.error('Save transcription error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Update existing transcription
   */
  async updateTranscription(transcriptionId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcriptions/${transcriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update transcription');
      }
      
      return data;
    } catch (error) {
      console.error('Update transcription error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Get transcription by ID
   */
  async getTranscription(transcriptionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcriptions/${transcriptionId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get transcription');
      }
      
      return data;
    } catch (error) {
      console.error('Get transcription error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Upload audio file for transcription
   */
  async uploadAudioForTranscription(meetingId, audioFile, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('meeting_id', meetingId);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await fetch(`${API_BASE_URL}/api/transcriptions/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload audio');
      }
      
      return data;
    } catch (error) {
      console.error('Upload audio error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Get transcription statistics for a meeting
   */
  async getTranscriptionStats(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/transcriptions/stats`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get stats');
      }
      
      return data;
    } catch (error) {
      console.error('Get transcription stats error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Search in transcriptions
   */
  async searchTranscriptions(meetingId, query, filters = {}) {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        ...filters
      });

      const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/transcriptions/search?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to search transcriptions');
      }
      
      return data;
    } catch (error) {
      console.error('Search transcriptions error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }

  /**
   * Export transcriptions in different formats
   */
  async exportTranscriptions(meetingId, format = 'json', options = {}) {
    try {
      const exportParams = new URLSearchParams({
        format,
        ...options
      });

      const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/transcriptions/export?${exportParams}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export transcriptions');
      }

      // Handle different response types based on format
      if (format === 'json') {
        return await response.json();
      } else {
        // For PDF, TXT, etc. return blob
        const blob = await response.blob();
        return { success: true, blob, filename: `transcriptions_${meetingId}.${format}` };
      }
    } catch (error) {
      console.error('Export transcriptions error:', error);
      return { success: false, message: error.message || 'Verbindingsfout' };
    }
  }
}

export default new TranscriptionService();