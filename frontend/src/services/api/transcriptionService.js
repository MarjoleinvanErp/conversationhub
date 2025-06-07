import authService from './authService';

const API_BASE_URL = 'http://localhost:8000';

class TranscriptionService {
  async getTranscriptions(meetingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/transcriptions`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get transcriptions error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

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
      return data;
    } catch (error) {
      console.error('Save transcription error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

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
      return data;
    } catch (error) {
      console.error('Update transcription error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

  async deleteTranscription(transcriptionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transcriptions/${transcriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete transcription error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }
}

export default new TranscriptionService();