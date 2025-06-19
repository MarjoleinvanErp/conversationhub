// File: frontend/src/services/api/n8nService.js

import apiClient from '../api.js';

/**
 * N8N Service for sending meeting data and receiving reports
 * Handles communication with N8N workflows via our Laravel backend
 */
class N8NService {
  
  /**
   * Export meeting data to N8N workflow
   * @param {string} meetingId - Meeting ID
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportMeetingToN8N(meetingId, options = {}) {
    try {
      console.log('🚀 Exporting meeting to N8N:', meetingId, options);
      
      const payload = {
        meeting_id: meetingId,
        export_options: {
          include_transcriptions: options.includeTranscriptions ?? true,
          include_agenda: options.includeAgenda ?? true,
          include_participants: options.includeParticipants ?? true,
          include_metadata: options.includeMetadata ?? true,
          format: options.format || 'complete',
          ...options
        }
      };

      const response = await apiClient.post('/api/n8n/export-meeting', payload);
      
      console.log('✅ N8N export response:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Meeting succesvol geëxporteerd naar N8N',
        export_id: response.data.data?.export_id,
        webhook_triggered: response.data.data?.webhook_triggered
      };
      
    } catch (error) {
      console.error('❌ N8N export error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij exporteren naar N8N',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get export status from N8N
   * @param {string} exportId - Export ID to check
   * @returns {Promise<Object>} Export status
   */
  async getExportStatus(exportId) {
    try {
      console.log('📊 Checking N8N export status:', exportId);
      
      const response = await apiClient.get(`/api/n8n/export-status/${exportId}`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error) {
      console.error('❌ Export status error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij ophalen export status',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Request report generation for a meeting
   * @param {string} meetingId - Meeting ID
   * @param {Object} reportOptions - Report generation options
   * @returns {Promise<Object>} Report generation result
   */
  async requestReportGeneration(meetingId, reportOptions = {}) {
    try {
      console.log('📝 Requesting report generation from N8N:', meetingId, reportOptions);
      
      const payload = {
        meeting_id: meetingId,
        report_options: {
          type: reportOptions.type || 'standard', // standard, summary, detailed
          language: reportOptions.language || 'nl',
          include_action_items: reportOptions.includeActionItems ?? true,
          include_summary: reportOptions.includeSummary ?? true,
          include_key_points: reportOptions.includeKeyPoints ?? true,
          include_next_steps: reportOptions.includeNextSteps ?? true,
          format: reportOptions.format || 'markdown',
          ...reportOptions
        }
      };

      const response = await apiClient.post('/api/n8n/generate-report', payload);
      
      console.log('✅ Report generation response:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Verslag generatie gestart',
        report_id: response.data.data?.report_id,
        estimated_completion: response.data.data?.estimated_completion
      };
      
    } catch (error) {
      console.error('❌ Report generation error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij aanvragen verslag generatie',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get generated report from N8N
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} Generated report
   */
  async getGeneratedReport(reportId) {
    try {
      console.log('📋 Fetching generated report:', reportId);
      
      const response = await apiClient.get(`/api/n8n/report/${reportId}`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error) {
      console.error('❌ Report fetch error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij ophalen verslag',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get all reports for a meeting
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object>} Meeting reports
   */
  async getMeetingReports(meetingId) {
    try {
      console.log('📚 Fetching meeting reports:', meetingId);
      
      const response = await apiClient.get(`/api/n8n/meeting/${meetingId}/reports`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error) {
      console.error('❌ Meeting reports fetch error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij ophalen meeting verslagen',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Send real-time data to N8N (for live updates during meeting)
   * @param {string} meetingId - Meeting ID
   * @param {Object} liveData - Real-time data
   * @returns {Promise<Object>} Send result
   */
  async sendLiveUpdate(meetingId, liveData) {
    try {
      console.log('⚡ Sending live update to N8N:', meetingId, liveData);
      
      const payload = {
        meeting_id: meetingId,
        timestamp: new Date().toISOString(),
        live_data: liveData
      };

      const response = await apiClient.post('/api/n8n/live-update', payload);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error) {
      console.error('❌ Live update error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij versturen live update',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get N8N configuration and status
   * @returns {Promise<Object>} N8N config
   */
  async getN8NConfig() {
    try {
      console.log('⚙️ Fetching N8N configuration...');
      
      const response = await apiClient.get('/api/n8n/config');
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error) {
      console.error('❌ N8N config error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij ophalen N8N configuratie',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Test N8N connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      console.log('🔗 Testing N8N connection...');
      
      const response = await apiClient.post('/api/n8n/test-connection');
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'N8N verbinding succesvol getest'
      };
      
    } catch (error) {
      console.error('❌ N8N connection test error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'N8N verbinding test mislukt',
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Cancel an ongoing export or report generation
   * @param {string} operationId - Operation ID to cancel
   * @returns {Promise<Object>} Cancel result
   */
  async cancelOperation(operationId) {
    try {
      console.log('❌ Cancelling N8N operation:', operationId);
      
      const response = await apiClient.post(`/api/n8n/cancel-operation/${operationId}`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Operatie succesvol geannuleerd'
      };
      
    } catch (error) {
      console.error('❌ Cancel operation error:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Fout bij annuleren operatie',
        error: error.response?.data?.error || error.message
      };
    }
  }
}

// Export een singleton instance
const n8nService = new N8NService();
export default n8nService;