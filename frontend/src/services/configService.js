import apiClient from './api.js';
import authService from './api/authService.js';

class ConfigService {
  constructor() {
    this.config = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch configuration from backend with authentication
   */
  async fetchConfig() {
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        console.warn('User not authenticated, using default config');
        return this.getDefaultConfig();
      }

      console.log('📡 Fetching config with auth token...');
      const response = await apiClient.get('/config');
      
      if (response.data && response.data.success) {
        this.config = response.data.data;
        this.lastFetch = Date.now();
        console.log('✅ Config loaded successfully:', this.config);
        return this.config;
      } else {
        console.warn('Config response not successful, using default');
        return this.getDefaultConfig();
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      
      // If it's a 401 (unauthorized), use default config instead of throwing
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.warn('Authentication failed, using default config');
        return this.getDefaultConfig();
      }
      
      // For other errors, also use default config to prevent app crash
      console.warn('Using default config due to error:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get all configuration with caching and auth check
   */
  async getAllConfig() {
    // If user is not authenticated, return default config
    if (!authService.isAuthenticated()) {
      console.log('User not authenticated, returning default config');
      return this.getDefaultConfig();
    }

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
        live_webspeech_enabled: false, // Safer default
        whisper_enabled: true,
        whisper_chunk_duration: 90,
        n8n_transcription_enabled: false,
        default_transcription_service: 'whisper',
        available_services: {
          whisper: true, // Assume available by default
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
        whisper_configured: true // Assume configured by default
      }
    };
  }

  /**
   * Get transcription configuration
   */
  async getTranscriptionConfig() {
    try {
      const config = await this.getAllConfig();
      return config.transcription || this.getDefaultConfig().transcription;
    } catch (error) {
      console.warn('Failed to get transcription config, using default');
      return this.getDefaultConfig().transcription;
    }
  }

  /**
   * Get N8N configuration
   */
  async getN8NConfig() {
    try {
      const config = await this.getAllConfig();
      return config.n8n || this.getDefaultConfig().n8n;
    } catch (error) {
      console.warn('Failed to get N8N config, using default');
      return this.getDefaultConfig().n8n;
    }
  }

  /**
   * Get privacy configuration
   */
  async getPrivacyConfig() {
    try {
      const config = await this.getAllConfig();
      return config.privacy || this.getDefaultConfig().privacy;
    } catch (error) {
      console.warn('Failed to get privacy config, using default');
      return this.getDefaultConfig().privacy;
    }
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
    return config.default_transcription_service || 'whisper';
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
      if (!authService.isAuthenticated()) {
        throw new Error('Authentication required');
      }

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

  /**
   * Clear cached config (useful after login/logout)
   */
  clearCache() {
    this.config = null;
    this.lastFetch = null;
  }
}

export default new ConfigService();