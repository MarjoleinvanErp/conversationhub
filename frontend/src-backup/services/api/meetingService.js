import authService from './authService';

// VITE gebruikt import.meta.env in plaats van process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class MeetingService {
  async getAllMeetings() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get meetings error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

  async createMeeting(meetingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create meeting error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

  async getMeeting(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get meeting error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

  async startMeeting(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Start meeting error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }

  async stopMeeting(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${id}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Stop meeting error:', error);
      return { success: false, message: 'Verbindingsfout' };
    }
  }
}

export default new MeetingService();