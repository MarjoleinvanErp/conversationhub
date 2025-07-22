import apiClient from './api.js';

class ConfigService {
  constructor() {
    this.config = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch configuration from backend
   */
  async fetchConfig() {
    try {
      const response = await apiClient.get('/config');
      
      if (response.data.success) {
        this.config = response.data.data;
        this.lastFetch = Date.now();
        return this.config;
      } else {
        throw new Error(response.data.error || 'Failed to fetch config');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      throw error;
    }
  }

  /**
   * Get all configuration with caching
   */
  async getAllConfig() {
    // Return cached config if it's still fresh
    if (this.config && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout) {
      return this.config;
    }

    // Fetch fresh config
    return await this.fetchConfig();
  }

  /**
   * Get default configuration values
   */
  getDefaultConfig() {
    return {
      transcription: {
        live_webspeech_enabled: true,
        whisper_enabled: true,
        whisper_chunk_duration: 90,
        n8n_transcription_enabled: false,
        default_transcription_service: 'auto',
        available_services: {
          whisper: false,
          n8n: false
        }
      },
      n8n: {
        auto_export_enabled: false,
        auto_export_interval_minutes: 10,
        webhook_url: null,
        api_key: null,
        transcription_enabled: false,
        transcription_webhook_url: null,
        timeout_seconds: 60
      },
      privacy: {
        filter_enabled: true,
        data_retention_days: 90,
        auto_delete_audio: true
      },
      azure: {
        whisper_configured: false
      }
    };
  }

  /**
   * Get transcription configuration
   */
  async getTranscriptionConfig() {
    const config = await this.getAllConfig();
    return config.transcription || this.getDefaultConfig().transcription;
  }

  /**
   * Get N8N configuration
   */
  async getN8NConfig() {
    const config = await this.getAllConfig();
    return config.n8n || this.getDefaultConfig().n8n;
  }

  /**
   * Get privacy configuration
   */
  async getPrivacyConfig() {
    const config = await this.getAllConfig();
    return config.privacy || this.getDefaultConfig().privacy;
  }

  /**
   * Check if live transcription is enabled
   */
  async isLiveTranscriptionEnabled() {
    const config = await this.getTranscriptionConfig();
    return config.live_webspeech_enabled;
  }

  /**
   * Check if Whisper is enabled
   */
  async isWhisperEnabled() {
    const config = await this.getTranscriptionConfig();
    return config.whisper_enabled;
  }

  /**
   * Check if N8N transcription is enabled
   */
  async isN8NTranscriptionEnabled() {
    const config = await this.getN8NConfig();
    return config.transcription_enabled;
  }

  /**
   * Get Whisper chunk duration
   */
  async getWhisperChunkDuration() {
    const config = await this.getTranscriptionConfig();
    return config.whisper_chunk_duration;
  }

  /**
   * Get default transcription service
   */
  async getDefaultTranscriptionService() {
    const config = await this.getTranscriptionConfig();
    return config.default_transcription_service || 'auto';
  }

  /**
   * Check if N8N auto export is enabled
   */
  async isN8NAutoExportEnabled() {
    const config = await this.getN8NConfig();
    return config.auto_export_enabled;
  }

  /**
   * Get N8N auto export interval
   */
  async getN8NAutoExportInterval() {
    const config = await this.getN8NConfig();
    return config.auto_export_interval_minutes;
  }

  /**
   * Check if N8N webhook is configured
   */
  async isN8NWebhookConfigured() {
    const config = await this.getN8NConfig();
    return !!config.webhook_url;
  }

  /**
   * Test transcription services
   */
  async testServices() {
    try {
      const response = await apiClient.post('/transcription/test-services');
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.error || 'Failed to test services');
      }
    } catch (error) {
      console.error('Failed to test services:', error);
      throw error;
    }
  }
}

export default new ConfigService();