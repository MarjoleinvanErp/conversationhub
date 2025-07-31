/**
 * Configuration Service
 * Handles loading of transcription configuration
 * This is a simplified version for the Enhanced Live Transcription component
 */

export interface TranscriptionConfig {
  live_webspeech_enabled: boolean;
  whisper_enabled: boolean;
  whisper_chunk_duration: number;
  n8n_transcription_enabled: boolean;
  default_transcription_service: 'auto' | 'whisper' | 'n8n';
  available_services: {
    whisper: boolean;
    n8n: boolean;
  };
}

class ConfigService {
  /**
   * Get transcription configuration
   * This would typically call your Laravel backend
   */
  async getTranscriptionConfig(): Promise<TranscriptionConfig> {
    try {
      // In a real implementation, this would be an API call to:
      // const response = await fetch('/api/transcription/config');
      
      // For now, return default configuration
      const config: TranscriptionConfig = {
        live_webspeech_enabled: true,
        whisper_enabled: true,
        whisper_chunk_duration: 90,
        n8n_transcription_enabled: false,
        default_transcription_service: 'auto',
        available_services: {
          whisper: true,
          n8n: false
        }
      };

      console.log('📋 Config service loaded:', config);
      return config;

    } catch (error) {
      console.error('❌ Failed to load config:', error);
      
      // Return fallback configuration
      return {
        live_webspeech_enabled: false,
        whisper_enabled: true,
        whisper_chunk_duration: 90,
        n8n_transcription_enabled: false,
        default_transcription_service: 'whisper',
        available_services: {
          whisper: true,
          n8n: false
        }
      };
    }
  }
}

// Export singleton instance
const configService = new ConfigService();
export default configService;