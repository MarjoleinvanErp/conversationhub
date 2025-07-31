import React, { useState, useRef, useEffect } from 'react';

const SpeakerDetection = ({ 
  isRecording, 
  audioStream, 
  onVoiceActivity
}) => {
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0);
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadIntervalRef = useRef(null);

  // VAD Configuration
  const VOICE_THRESHOLD = 25;

  useEffect(() => {
    if (isRecording && audioStream) {
      setupVoiceActivityDetection();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isRecording, audioStream]);

  const setupVoiceActivityDetection = async () => {
    try {
      // Cleanup any existing context first
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      // Setup new audio analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(audioStream);
      
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start VAD monitoring
      vadIntervalRef.current = setInterval(() => {
        performVoiceActivityDetection();
      }, 200);

    } catch (error) {
      console.error('Error setting up voice activity detection:', error);
    }
  };

  const performVoiceActivityDetection = () => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setVoiceActivityLevel(average);
    
    const isSpeaking = average > VOICE_THRESHOLD;
    setIsDetectingSpeech(isSpeaking);

    // Send activity to parent
    if (onVoiceActivity) {
      onVoiceActivity(average);
    }
  };

  const cleanup = () => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
  };

  if (!isRecording) {
    return null; // Don't show anything when not recording
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-medium mb-4">Voice Activity Monitor</h3>
      
      <div className="space-y-3">
        {/* Voice Activity Display */}
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isDetectingSpeech ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm">
            {isDetectingSpeech ? 'Spraak gedetecteerd' : 'Luistert...'}
          </span>
        </div>

        {/* Voice Level Bar */}
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${Math.min((voiceActivityLevel / 80) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Geluidsniveau: {Math.round(voiceActivityLevel)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerDetection;