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
    this.audioChunks = [];
    this.chunkCounter = 0;
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
        console.log('✅ Enhanced session started:', result);
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to start enhanced session:', error);
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
      console.log('🎤 Setting up voice profile for:', speakerId);

      const formData = new FormData();
      formData.append('session_id', this.currentSession.session_id);
      formData.append('speaker_id', speakerId);
      formData.append('voice_sample', audioBlob, `voice_${speakerId}.webm`);

      const response = await fetch(`${API_BASE_URL}/api/live-transcription/setup-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Voice profile setup result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to setup voice profile:', error);
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
      console.error('❌ Failed to process live transcription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process Whisper verification - FIXED
   */
  async processWhisperVerification(liveTranscriptionId, audioChunk) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    try {
      console.log('🤖 Starting Whisper verification:', {
        session_id: this.currentSession.session_id,
        live_transcription_id: liveTranscriptionId,
        chunk_size: audioChunk.size,
        chunk_type: audioChunk.type
      });

      const formData = new FormData();
      formData.append('session_id', this.currentSession.session_id);
      formData.append('live_transcription_id', liveTranscriptionId);
      
      // Ensure proper audio file format
      const audioFile = new File([audioChunk], `chunk_${Date.now()}.webm`, {
        type: 'audio/webm',
        lastModified: Date.now()
      });
      
      formData.append('audio_chunk', audioFile);

      const response = await fetch(`${API_BASE_URL}/api/live-transcription/verify-whisper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: formData,
      });

      console.log('🤖 Whisper API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Whisper API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Whisper verification completed:', {
        success: result.success,
        original_id: liveTranscriptionId,
        whisper_text: result.transcription?.text?.substring(0, 50) + '...'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Whisper verification failed:', error);
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
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'network') {
        onError(event.error);
      }
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
   * Start recording with FIXED audio chunking
   */
  async startRecording() {
    try {
      console.log('🎤 Starting recording with fixed chunking...');
      
      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      this.isRecording = true;
      this.audioChunks = [];
      this.chunkCounter = 0;

      // Start speech recognition
      if (this.speechRecognition) {
        this.speechRecognition.start();
        console.log('🎤 Speech recognition started');
      }

      // Setup FIXED audio chunking
      this.setupFixedAudioChunking();

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup FIXED audio chunking for Whisper
   */
  setupFixedAudioChunking() {
    console.log('🔧 Setting up FIXED audio chunking...');
    
    // Create new MediaRecorder for each chunk cycle
    const startNewChunkCycle = () => {
      if (!this.isRecording || !this.audioStream) {
        return;
      }

      console.log('🆕 Starting new chunk cycle:', ++this.chunkCounter);

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      // Collect data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📦 Chunk data collected:', event.data.size, 'bytes');
          this.audioChunks.push(event.data);
        }
      };

      // Process when stopped
      this.mediaRecorder.onstop = () => {
        if (this.audioChunks.length > 0) {
          const combinedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          console.log('🎵 Created 30-second audio chunk:', {
            size: combinedBlob.size,
            type: combinedBlob.type,
            chunk_number: this.chunkCounter,
            timestamp: new Date().toLocaleTimeString()
          });

          // Send to callback for Whisper processing
          if (this.onChunkCallback) {
            this.onChunkCallback(combinedBlob);
          }
        }

        // Start next cycle if still recording
        if (this.isRecording) {
          setTimeout(startNewChunkCycle, 500);
        }
      };

      // Start recording for this chunk
      this.mediaRecorder.start();

      // Stop after 30 seconds to create chunk
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          console.log('⏰ 30 seconds reached, stopping chunk', this.chunkCounter);
          this.mediaRecorder.stop();
        }
      }, 30000); // 30 seconds
    };

    // Start first cycle
    startNewChunkCycle();
  }

  /**
   * Set callback for audio chunk processing
   */
  setChunkCallback(callback) {
    console.log('🔗 Setting chunk callback for Whisper processing');
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
      } catch (error) {
        console.warn('Warning stopping speech recognition:', error);
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.warn('Warning stopping MediaRecorder:', error);
      }
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }

    this.audioChunks = [];
    this.chunkCounter = 0;
    console.log('✅ Recording stopped and cleaned up');
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