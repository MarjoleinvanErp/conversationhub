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

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to process Whisper verification:', error);
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
      // Auto-restart if still recording
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
   * Start recording and transcription
   */
  async startRecording() {
    try {
      // Get microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Setup MediaRecorder for audio chunks
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.isRecording = true;

      // Start speech recognition
      if (this.speechRecognition) {
        this.speechRecognition.start();
      }

      // Setup chunking for Whisper processing (every 30 seconds)
      this.setupAudioChunking();

      return { success: true };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup audio chunking for Whisper processing
   */
  setupAudioChunking() {
    const chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      if (chunks.length > 0) {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Process with Whisper if we have a recent live transcription
        this.onAudioChunkReady(audioBlob);
        
        chunks.length = 0; // Clear chunks
      }
    };

    // Record in 30-second chunks
    this.chunkInterval = setInterval(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
        setTimeout(() => {
          if (this.isRecording) {
            this.mediaRecorder.start();
          }
        }, 100);
      }
    }, 30000); // 30 seconds

    this.mediaRecorder.start();
  }

  /**
   * Handle audio chunk ready for Whisper processing
   */
  onAudioChunkReady(audioBlob) {
    // This will be called by the component to process with Whisper
    if (this.onChunkCallback) {
      this.onChunkCallback(audioBlob);
    }
  }

  /**
   * Set callback for audio chunk processing
   */
  setChunkCallback(callback) {
    this.onChunkCallback = callback;
  }

  /**
   * Stop recording and transcription
   */
  stopRecording() {
    this.isRecording = false;

    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }

    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
    }
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