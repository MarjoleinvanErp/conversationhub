import apiClient from '../api.js';

/**
 * Meeting Type Service for managing conversation types
 */
class MeetingTypeService {
  
  /**
   * Get all meeting types
   * @returns {Promise<Array>} List of meeting types
   */
  async getAllMeetingTypes() {
    try {
      console.log('🔍 Fetching all meeting types...');
      const response = await apiClient.get('/meeting-types');
      
      if (response.data.success) {
        console.log('✅ Meeting types loaded:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch meeting types');
    } catch (error) {
      console.error('❌ Error fetching meeting types:', error);
      throw error;
    }
  }

  /**
   * Get specific meeting type
   * @param {number} id - Meeting type ID
   * @returns {Promise<Object>} Meeting type data
   */
  async getMeetingType(id) {
    try {
      console.log('🔍 Fetching meeting type:', id);
      const response = await apiClient.get(`/meeting-types/${id}`);
      
      if (response.data.success) {
        console.log('✅ Meeting type loaded:', response.data.data.display_name);
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch meeting type');
    } catch (error) {
      console.error('❌ Error fetching meeting type:', error);
      throw error;
    }
  }

  /**
   * Create new meeting type
   * @param {Object} meetingTypeData - Meeting type data
   * @returns {Promise<Object>} Created meeting type
   */
  async createMeetingType(meetingTypeData) {
    try {
      console.log('🔨 Creating meeting type:', meetingTypeData.display_name);
      const response = await apiClient.post('/meeting-types', meetingTypeData);
      
      if (response.data.success) {
        console.log('✅ Meeting type created successfully');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to create meeting type');
    } catch (error) {
      console.error('❌ Error creating meeting type:', error);
      throw error;
    }
  }

  /**
   * Update meeting type
   * @param {number} id - Meeting type ID
   * @param {Object} meetingTypeData - Updated meeting type data
   * @returns {Promise<Object>} Updated meeting type
   */
  async updateMeetingType(id, meetingTypeData) {
    try {
      console.log('📝 Updating meeting type:', id);
      const response = await apiClient.put(`/meeting-types/${id}`, meetingTypeData);
      
      if (response.data.success) {
        console.log('✅ Meeting type updated successfully');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to update meeting type');
    } catch (error) {
      console.error('❌ Error updating meeting type:', error);
      throw error;
    }
  }

  /**
   * Delete (deactivate) meeting type
   * @param {number} id - Meeting type ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMeetingType(id) {
    try {
      console.log('🗑️ Deleting meeting type:', id);
      const response = await apiClient.delete(`/meeting-types/${id}`);
      
      if (response.data.success) {
        console.log('✅ Meeting type deleted successfully');
        return true;
      }
      
      throw new Error(response.data.message || 'Failed to delete meeting type');
    } catch (error) {
      console.error('❌ Error deleting meeting type:', error);
      throw error;
    }
  }

  /**
   * Get default agenda for meeting type
   * @param {number} id - Meeting type ID
   * @returns {Promise<Array>} Default agenda items
   */
  async getDefaultAgenda(id) {
    try {
      console.log('📋 Fetching default agenda for meeting type:', id);
      const response = await apiClient.get(`/meeting-types/${id}/default-agenda`);
      
      if (response.data.success) {
        console.log('✅ Default agenda loaded');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch default agenda');
    } catch (error) {
      console.error('❌ Error fetching default agenda:', error);
      throw error;
    }
  }

  /**
   * Test privacy filters with sample text
   * @param {number} id - Meeting type ID
   * @param {string} text - Text to test
   * @returns {Promise<Object>} Filter test results
   */
  async testPrivacyFilters(id, text) {
    try {
      console.log('🔍 Testing privacy filters for meeting type:', id);
      const response = await apiClient.post(`/meeting-types/${id}/test-privacy-filters`, { text });
      
      if (response.data.success) {
        console.log('✅ Privacy filter test completed');
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to test privacy filters');
    } catch (error) {
      console.error('❌ Error testing privacy filters:', error);
      throw error;
    }
  }
}

export default new MeetingTypeService();