import authService from './authService';

const API_BASE_URL = 'http://localhost:8000';

class EnhancedLiveTranscriptionService {
  constructor() {
    this.currentSession = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioStream = null;
    this.speechRecognition = null;
    this.chunkInterval = null;
    this.audioChunks = []; // Store chunks temporarily
  }

  /**
   * Start enhanced transcription session
   */
  async startEnhancedSession(meetingId, participants) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-transcription/enhanced/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          participants: participants
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.currentSession = result;
        console.log('Enhanced session started:', result);
      }

      return result;
    } catch (error) {
      console.error('Failed to start enhanced session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup voice profile for speaker
   */
  async setupVoiceProfile(speakerId, audioBlob) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      console.log('Setting up voice profile for:', speakerId);
      console.log('Session ID:', this.currentSession.session_id);
      console.log('Audio blob size:', audioBlob.size);

      const formData = new FormData();
      formData.append('session_id', this.currentSession.session_id);
      formData.append('speaker_id', speakerId);
      formData.append('voice_sample', audioBlob, `voice_${speakerId}.webm`);

      console.log('FormData created, making API call...');

      const response = await fetch(`${API_BASE_URL}/api/live-transcription/setup-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Voice profile setup result:', result);
      
      return result;
    } catch (error) {
      console.error('Failed to setup voice profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process live transcription text
   */
  async processLiveTranscription(text, confidence = 0.8) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/live-transcription/process-live`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.currentSession.session_id,
          live_text: text,
          confidence: confidence
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to process live transcription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process Whisper verification
   */
  async processWhisperVerification(liveTranscriptionId, audioChunk) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      console.log('🔄 Starting Whisper verification for:', {
        session_id: this.currentSession.session_id,
        live_transcription_id: liveTranscriptionId,
        audio_chunk_size: audioChunk.size,
        audio_chunk_type: audioChunk.type
      });

      const formData = new FormData();
      formData.append('session_id', this.currentSession.session_id);
      formData.append('live_transcription_id', liveTranscriptionId);
      formData.append('audio_chunk', audioChunk, 'chunk.webm');

      const response = await fetch(`${API_BASE_URL}/api/live-transcription/verify-whisper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      console.log('🔄 Whisper API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Whisper API error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Whisper verification result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to process Whisper verification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup browser speech recognition
   */
  setupSpeechRecognition(onResult, onError) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      onError('Speech recognition not supported');
      return false;
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'nl-NL';

    this.speechRecognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence || 0.8;
        const isFinal = event.results[i].isFinal;

        onResult({
          transcript,
          confidence,
          isFinal,
          timestamp: new Date()
        });
      }
    };

    this.speechRecognition.onerror = (event) => {
      onError(event.error);
    };

    this.speechRecognition.onend = () => {
      if (this.isRecording) {
        setTimeout(() => {
          try {
            this.speechRecognition.start();
          } catch (error) {
            console.warn('Failed to restart speech recognition:', error);
          }
        }, 100);
      }
    };

    return true;
  }

  /**
   * Start recording and transcription - IMPROVED CHUNKING
   */
  async startRecording() {
    try {
      console.log('🎤 Starting recording with improved chunking...');
      
      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Setup MediaRecorder for audio chunks - FIXED CHUNKING
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.isRecording = true;
      this.audioChunks = []; // Clear chunks

      console.log('🎤 MediaRecorder created with:', this.mediaRecorder.mimeType);

      // Start speech recognition
      if (this.speechRecognition) {
        this.speechRecognition.start();
        console.log('🎤 Speech recognition started');
      }

      // Setup improved chunking for Whisper processing
      this.setupImprovedAudioChunking();

      return { success: true };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup improved audio chunking for Whisper processing
   */
  setupImprovedAudioChunking() {
    console.log('🔧 Setting up improved audio chunking...');
    
    // Clear any existing chunks
    this.audioChunks = [];

    // Handle data collection - COLLECT EVERYTHING
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        console.log('📦 Audio chunk collected:', {
          size: event.data.size,
          type: event.data.type,
          total_chunks: this.audioChunks.length + 1,
          timestamp: new Date().toLocaleTimeString()
        });
        
        this.audioChunks.push(event.data);
      }
    };

    // Handle stop event - PROCESS ACCUMULATED CHUNKS
    this.mediaRecorder.onstop = () => {
      console.log('⏹️ MediaRecorder stopped, processing chunks:', {
        total_chunks: this.audioChunks.length,
        total_size: this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0)
      });
      
      if (this.audioChunks.length > 0) {
        // Create combined blob from all chunks
        const combinedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        console.log('🎵 Created combined audio blob:', {
          size: combinedBlob.size,
          type: combinedBlob.type,
          chunks_combined: this.audioChunks.length
        });
        
        // Send to callback for processing
        this.onAudioChunkReady(combinedBlob);
        
        // Clear chunks for next cycle
        this.audioChunks = [];
      }
    };

    // Start recording immediately with small intervals for data collection
    this.mediaRecorder.start(1000); // Collect data every 1 second

    // Setup chunking interval - CREATE WHISPER CHUNKS EVERY 30 SECONDS
    this.chunkInterval = setInterval(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording' && this.isRecording) {
        console.log('⏰ 30-second interval reached, creating Whisper chunk...');
        console.log('📊 Current chunks collected:', this.audioChunks.length);
        
        // Stop to trigger processing, then restart
        this.mediaRecorder.stop();
        
        // Restart after a short delay
        setTimeout(() => {
          if (this.isRecording && this.audioStream) {
            try {
              this.mediaRecorder.start(1000);
              console.log('🔄 MediaRecorder restarted for next chunk cycle');
            } catch (error) {
              console.error('❌ Failed to restart MediaRecorder:', error);
            }
          }
        }, 100);
      }
    }, 30000); // Every 30 seconds

    console.log('✅ Improved audio chunking setup complete');
  }

  /**
   * Handle audio chunk ready for Whisper processing
   */
  onAudioChunkReady(audioBlob) {
    console.log('🎵 Audio chunk ready for processing:', {
      size: audioBlob.size,
      type: audioBlob.type,
      size_mb: (audioBlob.size / 1024 / 1024).toFixed(2) + 'MB',
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Call the callback if set
    if (this.onChunkCallback) {
      this.onChunkCallback(audioBlob);
    } else {
      console.warn('⚠️ No chunk callback set - audio chunk not processed');
    }
  }

  /**
   * Set callback for audio chunk processing
   */
  setChunkCallback(callback) {
    console.log('🔗 Setting chunk callback');
    this.onChunkCallback = callback;
  }

  /**
   * Stop recording and transcription
   */
  stopRecording() {
    console.log('🛑 Stopping recording...');
    this.isRecording = false;

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
        console.log('🛑 Speech recognition stopped');
      } catch (error) {
        console.warn('Warning stopping speech recognition:', error);
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
        console.log('🛑 MediaRecorder stopped');
      } catch (error) {
        console.warn('Warning stopping MediaRecorder:', error);
      }
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Audio track stopped');
      });
    }

    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
      this.chunkInterval = null;
      console.log('🛑 Chunk interval cleared');
    }

    // Clear chunks
    this.audioChunks = [];
    console.log('🧹 Audio chunks cleared');
  }

  /**
   * Record voice sample for setup
   */
  async recordVoiceSample(duration = 5000) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      return new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };

        recorder.onerror = (e) => {
          stream.getTracks().forEach(track => track.stop());
          reject(e);
        };

        recorder.start();

        // Auto-stop after duration
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, duration);
      });
    } catch (error) {
      throw new Error('Failed to record voice sample: ' + error.message);
    }
  }
}

export default new EnhancedLiveTranscriptionService();