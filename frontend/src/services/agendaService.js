import api from './api';

export const agendaService = {
  // Get agenda items for a meeting
  getAgendaItems: async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}/agenda`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agenda items:', error);
      throw error;
    }
  },

  // Update agenda item status
  updateAgendaItemStatus: async (meetingId, agendaItemId, status, completed = null) => {
    try {
      const data = { status };
      if (completed !== null) {
        data.completed = completed;
      }
      
      const response = await api.put(`/meetings/${meetingId}/agenda/${agendaItemId}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating agenda item status:', error);
      throw error;
    }
  },

  // Add new agenda item
  addAgendaItem: async (meetingId, agendaItemData) => {
    try {
      const response = await api.post(`/meetings/${meetingId}/agenda`, agendaItemData);
      return response.data;
    } catch (error) {
      console.error('Error adding agenda item:', error);
      throw error;
    }
  }
};