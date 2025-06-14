import api from './api';

export const agendaService = {
  // Get agenda items for a meeting
  getAgendaItems: async (meetingId) => {
    try {
      console.log('🔍 Fetching agenda items for meeting:', meetingId);
      const response = await api.get(`/meetings/${meetingId}/agenda`);
      console.log('✅ Agenda items fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching agenda items:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        meetingId
      });
      throw error;
    }
  },

  // Update agenda item status
  updateAgendaItemStatus: async (meetingId, agendaItemId, status, completed = null) => {
    try {
      console.log('🔄 Updating agenda item status:', {
        meetingId,
        agendaItemId,
        status,
        completed
      });

      const data = { status };
      if (completed !== null) {
        data.completed = completed;
      }
      
      const response = await api.put(`/meetings/${meetingId}/agenda/${agendaItemId}/status`, data);
      console.log('✅ Agenda item status updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating agenda item status:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        meetingId,
        agendaItemId,
        requestData: { status, completed }
      });
      throw error;
    }
  },

  // Add new agenda item
  addAgendaItem: async (meetingId, agendaItemData) => {
    try {
      console.log('➕ Adding agenda item:', {
        meetingId,
        agendaItemData
      });

      const response = await api.post(`/meetings/${meetingId}/agenda`, agendaItemData);
      console.log('✅ Agenda item added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding agenda item:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        meetingId,
        agendaItemData,
        url: `/meetings/${meetingId}/agenda`
      });

      // Additional debugging info
      if (error.response) {
        console.error('Response headers:', error.response.headers);
        console.error('Response config:', error.response.config);
      }

      throw error;
    }
  }
};