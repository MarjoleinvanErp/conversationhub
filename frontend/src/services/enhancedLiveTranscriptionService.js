import apiClient from './apiClient';

class EnhancedLiveTranscriptionService {
  constructor() {
    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.recognition = null;
    this.onTranscriptionCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Start recording with enhanced transcription support
   */
  async startRecording(options = {}) {
    try {
      const { sessionId, onTranscription, onError } = options;
      
      this.onTranscriptionCallback = onTranscription;
      this.onErrorCallback = onError;

      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Setup MediaRecorder for chunk processing
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        if (this.onErrorCallback) {
          this.onErrorCallback('MediaRecorder error: ' + event.error.message);
        }
      };

      // Setup live speech recognition if supported
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        this.setupLiveSpeechRecognition();
      }

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.isPaused = false;

      console.log('🎤 Enhanced recording started');

      return {
        success: true,
        sessionId: sessionId,
        features: {
          mediaRecorder: true,
          speechRecognition: !!this.recognition,
          audioStream: true
        }
      };

    } catch (error) {
      console.error('Failed to start recording:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup live speech recognition
   */
  setupLiveSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'nl-NL';

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            
            if (this.onTranscriptionCallback) {
              this.onTranscriptionCallback({
                transcript: finalTranscript,
                confidence: confidence,
                isFinal: true,
                timestamp: new Date()
              });
            }
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Try to restart recognition if it's not a fatal error
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setTimeout(() => {
            if (this.isRecording && !this.isPaused) {
              try {
                this.recognition.start();
              } catch (e) {
                console.log('Could not restart speech recognition:', e);
              }
            }
          }, 1000);
        }
      };

      this.recognition.onend = () => {
        // Restart recognition if we're still recording
        if (this.isRecording && !this.isPaused) {
          try {
            this.recognition.start();
          } catch (e) {
            console.log('Could not restart speech recognition:', e);
          }
        }
      };

      this.recognition.start();
      console.log('🗣️ Live speech recognition started');

    } catch (error) {
      console.error('Failed to setup speech recognition:', error);
    }
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      this.isPaused = true;

      if (this.recognition) {
        this.recognition.stop();
      }

      console.log('⏸️ Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          console.log('Could not restart speech recognition:', e);
        }
      }

      console.log('▶️ Recording resumed');
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;

      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }

      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }

      console.log('⏹️ Recording stopped');
    }
  }

  /**
   * Get current audio chunk for processing
   */
  async getAudioChunk() {
    if (!this.audioChunks.length) {
      return null;
    }

    try {
      // Create blob from collected chunks
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
      
      // Clear chunks for next collection
      this.audioChunks = [];

      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Remove data URL prefix to get pure base64
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

    } catch (error) {
      console.error('Failed to get audio chunk:', error);
      return null;
    }
  }

  /**
   * Process audio chunk with backend services
   */
  async processChunk(options = {}) {
    try {
      const { audioData, sessionId, preferredService = 'auto', useN8N = false } = options;

      if (!audioData) {
        throw new Error('No audio data provided');
      }

      const response = await apiClient.post('/transcription/live', {
        audio_data: audioData,
        session_id: sessionId,
        preferred_service: preferredService,
        use_n8n: useN8N
      });

      if (response.data.success) {
        return {
          success: true,
          transcription: response.data.data.transcription,
          transcriptions: response.data.data.transcriptions,
          primary_source: response.data.data.primary_source,
          session_stats: response.data.data.session_stats,
          processing_details: response.data.data.processing_details
        };
      } else {
        return {
          success: false,
          error: response.data.error
        };
      }

    } catch (error) {
      console.error('Chunk processing failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get transcription configuration
   */
  async getConfig() {
    try {
      const response = await apiClient.get('/transcription/config');
      
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
      const response = await apiClient.post('/transcription/test-services');
      
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
      const response = await apiClient.post('/transcription/preferred-service', {
        session_id: sessionId,
        service: service
      });
      
      if (response.data.success) {
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
      const response = await apiClient.get('/transcription/preferred-service', {
        params: { session_id: sessionId }
      });
      
      if (response.data.success) {
        return response.data.data.preferred_service;
      } else {
        throw new Error(response.data.error);
      }

    } catch (error) {
      console.error('Failed to get preferred service:', error);
      throw error;
    }
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
      audioChunksCount: this.audioChunks.length
    };
  }
}

// Export singleton instance
export default new EnhancedLiveTranscriptionService();