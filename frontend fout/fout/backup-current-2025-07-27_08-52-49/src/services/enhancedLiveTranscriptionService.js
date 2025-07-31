import apiClient from './apiClient';

class EnhancedLiveTranscriptionService {
  constructor() {
    this.mediaRecorder = null;
    this.audioStream = null;
    this.recognition = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.lastProcessedTime = 0;
    this.chunkInterval = 5000; // 5 seconds per chunk
    this.currentSessionId = null;
    this.preferredService = 'auto';
    this.useN8N = false;
    this.serviceConfig = null;
    
    // Event handlers
    this.onTranscriptionReceived = null;
    this.onServiceStatusChanged = null;
    this.onError = null;
  }

  /**
   * Initialize enhanced transcription service
   */
  async initialize(sessionId, options = {}) {
    try {
      this.currentSessionId = sessionId;
      this.preferredService = options.preferredService || 'auto';
      this.useN8N = options.useN8N || false;
      
      // Get service configuration
      this.serviceConfig = await this.getTranscriptionConfig();
      
      console.log('Enhanced transcription service initialized', {
        sessionId: this.currentSessionId,
        preferredService: this.preferredService,
        useN8N: this.useN8N,
        availableServices: this.serviceConfig?.available_services
      });
      
      return {
        success: true,
        sessionId: this.currentSessionId,
        config: this.serviceConfig
      };
      
    } catch (error) {
      console.error('Failed to initialize enhanced transcription service:', error);
      throw error;
    }
  }

  /**
   * Start recording with enhanced transcription
   */
  async startRecording(options = {}) {
    try {
      if (this.isRecording) {
        throw new Error('Recording is already in progress');
      }

      // Get user media
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Setup MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.lastProcessedTime = Date.now();

      // Setup MediaRecorder event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped');
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        if (this.onError) {
          this.onError(event.error);
        }
      };

      // Setup browser speech recognition for real-time feedback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'nl-NL';

        this.recognition.onresult = (event) => {
          // This provides immediate visual feedback while waiting for enhanced transcription
          if (this.onTranscriptionReceived) {
            const lastResult = event.results[event.results.length - 1];
            this.onTranscriptionReceived({
              text: lastResult[0].transcript,
              isFinal: lastResult.isFinal,
              source: 'browser_realtime',
              confidence: lastResult[0].confidence || 0.8
            });
          }
        };

        this.recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
        };

        this.recognition.start();
      }

      // Start recording
      this.mediaRecorder.start(this.chunkInterval);
      this.isRecording = true;
      this.isPaused = false;

      console.log('Enhanced recording started successfully');
      
      return {
        success: true,
        sessionId: this.currentSessionId,
        useN8N: this.useN8N,
        preferredService: this.preferredService
      };

    } catch (error) {
      console.error('Failed to start enhanced recording:', error);
      throw error;
    }
  }

  /**
   * Process audio chunk with enhanced transcription services
   */
  async processAudioChunk(audioBlob) {
    try {
      const currentTime = Date.now();
      
      // Convert blob to base64
      const audioData = await this.blobToBase64(audioBlob);
      
      console.log('Processing audio chunk with enhanced services', {
        sessionId: this.currentSessionId,
        chunkSize: audioBlob.size,
        preferredService: this.preferredService,
        useN8N: this.useN8N
      });

      // Send to enhanced transcription API
      const response = await apiClient.post('/enhanced-transcription/process-live', {
        audio_data: audioData.split(',')[1], // Remove data:audio/webm;base64, prefix
        session_id: this.currentSessionId,
        preferred_service: this.preferredService,
        use_n8n: this.useN8N,
        timestamp: currentTime,
        chunk_interval: this.chunkInterval
      });

      if (response.data.success) {
        const result = response.data.data;
        
        // Handle multiple transcriptions if available
        if (result.transcriptions && result.transcriptions.length > 0) {
          result.transcriptions.forEach(transcription => {
            if (this.onTranscriptionReceived) {
              this.onTranscriptionReceived({
                text: transcription.text,
                speaker_name: transcription.speaker_name || 'Onbekende spreker',
                speaker_id: transcription.speaker_id,
                speaker_color: transcription.speaker_color,
                confidence: transcription.confidence || 0.8,
                speaker_confidence: transcription.speaker_confidence || 0.7,
                source: transcription.source || result.primary_source,
                isFinal: true,
                timestamp: transcription.spoken_at || new Date().toISOString(),
                processing_status: transcription.processing_status || 'completed'
              });
            }
          });
        } else if (result.transcription) {
          // Fallback to single transcription
          if (this.onTranscriptionReceived) {
            this.onTranscriptionReceived({
              text: result.transcription.text,
              speaker_name: result.transcription.speaker_name || 'Onbekende spreker',
              confidence: result.transcription.confidence || 0.8,
              source: result.primary_source,
              isFinal: true,
              timestamp: result.transcription.spoken_at || new Date().toISOString()
            });
          }
        }

        // Update service status if callback is available
        if (this.onServiceStatusChanged && result.session_stats) {
          this.onServiceStatusChanged({
            primary_source: result.primary_source,
            session_stats: result.session_stats,
            processing_details: result.processing_details || []
          });
        }

        this.lastProcessedTime = currentTime;
        
      } else {
        console.error('Enhanced transcription failed:', response.data.error);
        if (this.onError) {
          this.onError(new Error(response.data.error));
        }
      }

    } catch (error) {
      console.error('Failed to process audio chunk:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Convert blob to base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.isRecording && !this.isPaused) {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.pause();
      }
      if (this.recognition) {
        this.recognition.stop();
      }
      this.isPaused = true;
      console.log('Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.isRecording && this.isPaused) {
      if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
        this.mediaRecorder.resume();
      }
      if (this.recognition) {
        this.recognition.start();
      }
      this.isPaused = false;
      console.log('Recording resumed');
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }

      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      this.isRecording = false;
      this.isPaused = false;
      
      console.log('Enhanced recording stopped successfully');
      
      return {
        success: true,
        chunksProcessed: this.audioChunks.length,
        sessionId: this.currentSessionId
      };

    } catch (error) {
      console.error('Failed to stop enhanced recording:', error);
      throw error;
    }
  }

  /**
   * Get transcription configuration including N8N status
   */
  async getTranscriptionConfig() {
    try {
      const response = await apiClient.get('/enhanced-transcription/config');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }

    } catch (error) {
      console.error('Failed to get transcription config:', error);
      throw error;
    }
  }

  /**
   * Test available transcription services
   */
  async testServices() {
    try {
      const response = await apiClient.post('/enhanced-transcription/test-services');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }

    } catch (error) {
      console.error('Failed to test services:', error);
      throw error;
    }
  }

  /**
   * Set preferred transcription service for session
   */
  async setPreferredService(sessionId, service) {
    try {
      const response = await apiClient.post('/enhanced-transcription/preferred-service', {
        session_id: sessionId,
        service: service
      });
      
      if (response.data.success) {
        this.preferredService = service;
        return response.data.data;
      } else {
        throw new Error(response.data.error);
      }

    } catch (error) {
      console.error('Failed to set preferred service:', error);
      throw error;
    }
  }

  /**
   * Get preferred transcription service for session
   */
  async getPreferredService(sessionId) {
    try {
      const response = await apiClient.get('/enhanced-transcription/preferred-service', {
        params: { session_id: sessionId }
      });
      
      if (response.data.success) {
        this.preferredService = response.data.data.preferred_service;
        return this.preferredService;
      } else {
        throw new Error(response.data.error);
      }

    } catch (error) {
      console.error('Failed to get preferred service:', error);
      throw error;
    }
  }

  /**
   * Enable or disable N8N processing
   */
  setN8NEnabled(enabled) {
    this.useN8N = enabled;
    console.log('N8N processing', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Check if recording is active
   */
  isActivelyRecording() {
    return this.isRecording && !this.isPaused;
  }

  /**
   * Get recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      hasAudioStream: !!this.audioStream,
      hasMediaRecorder: !!this.mediaRecorder,
      hasSpeechRecognition: !!this.recognition,
      audioChunksCount: this.audioChunks.length,
      sessionId: this.currentSessionId,
      preferredService: this.preferredService,
      useN8N: this.useN8N
    };
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers) {
    this.onTranscriptionReceived = handlers.onTranscriptionReceived || null;
    this.onServiceStatusChanged = handlers.onServiceStatusChanged || null;
    this.onError = handlers.onError || null;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    this.onTranscriptionReceived = null;
    this.onServiceStatusChanged = null;
    this.onError = null;
    this.serviceConfig = null;
    this.currentSessionId = null;
  }
}

// Export singleton instance
export default new EnhancedLiveTranscriptionService();