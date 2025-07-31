import apiService from '../api.js';

class ReportService {
  // Get all reports for a meeting
  async getReports(meetingId) {
    try {
      console.log(`📡 Getting reports for meeting ${meetingId}`);
      const result = await apiService.get(`/meetings/${meetingId}/reports`);
      return {
        success: true,
        data: result.reports || []
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get specific report with sections
  async getReport(meetingId, reportId) {
    try {
      console.log(`📡 Getting report ${reportId} for meeting ${meetingId}`);
      const result = await apiService.get(`/meetings/${meetingId}/reports/${reportId}`);
      return {
        success: true,
        data: result.report
      };
    } catch (error) {
      console.error('Error getting report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update specific section
  async updateSection(meetingId, reportId, sectionId, data) {
    try {
      console.log(`📡 Updating section ${sectionId} in report ${reportId}`);
      const result = await apiService.put(`/meetings/${meetingId}/reports/${reportId}/sections/${sectionId}`, data);
      return {
        success: true,
        data: result.section
      };
    } catch (error) {
      console.error('Error updating section:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Toggle privacy filtering
  async togglePrivacyFiltering(meetingId, reportId) {
    try {
      console.log(`📡 Toggling privacy filtering for report ${reportId}`);
      const result = await apiService.post(`/meetings/${meetingId}/reports/${reportId}/privacy-toggle`);
      return {
        success: true,
        data: result.report
      };
    } catch (error) {
      console.error('Error toggling privacy filtering:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get report stats
  async getReportStats(meetingId) {
    try {
      console.log(`📡 Getting report stats for meeting ${meetingId}`);
      const result = await apiService.get(`/meetings/${meetingId}/reports/stats`);
      return {
        success: true,
        data: result.stats
      };
    } catch (error) {
      console.error('Error getting report stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Export report as HTML
  async exportHtml(meetingId, reportId) {
    try {
      console.log(`📡 Exporting report ${reportId} as HTML`);
      const result = await apiService.get(`/meetings/${meetingId}/reports/${reportId}/export/html`);
      return {
        success: true,
        data: result.html_content,
        title: result.report_title
      };
    } catch (error) {
      console.error('Error exporting HTML:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ReportService();