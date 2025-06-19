/**
 * Configuration Service
 * Simple service to fetch configuration from backend
 */

// Browser-vriendelijke API URL configuratie
const getApiBaseUrl = () => {
  // Probeer React env variabele eerst
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback naar huidige locatie detectie
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const port = hostname === 'localhost' ? '8000' : window.location.port;
    return `${protocol}//${hostname}:${port}/api`;
  }
  
  // Ultimate fallback
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

class ConfigService {
  constructor() {
    this.config = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minuten cache
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Fetch configuration from backend
   */
  async fetchConfig() {
    try {
      // Check cache
      if (this.config && this.lastFetch && (Date.now() - this.lastFetch < this.cacheTimeout)) {
        return this.config;
      }

      // Try public config first (no authentication required)
      const response = await fetch(`${API_BASE_URL}/config/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Fout bij ophalen configuratie');
      }

      this.config = data.data;
      this.lastFetch = Date.now();
      
      return this.config;
    } catch (error) {
      console.error('❌ Config fetch error:', error);
      
      // Return default config on error
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration (fallback)
   */
  getDefaultConfig() {
    return {
      transcription: {
        live_webspeech_enabled: true,
        whisper_enabled: true,
        whisper_chunk_duration: 90
      },
      n8n: {
        auto_export_enabled: false,
        auto_export_interval_minutes: 10
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
    const config = await this.fetchConfig();
    return config.transcription || this.getDefaultConfig().transcription;
  }

  /**
   * Get N8N configuration
   */
  async getN8NConfig() {
    const config = await this.fetchConfig();
    return config.n8n || this.getDefaultConfig().n8n;
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
   * Get Whisper chunk duration
   */
  async getWhisperChunkDuration() {
    const config = await this.getTranscriptionConfig();
    return config.whisper_chunk_duration;
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
   * Clear cache (force refresh on next fetch)
   */
  clearCache() {
    this.config = null;
    this.lastFetch = null;
  }
}

// Export singleton instance
export default new ConfigService();