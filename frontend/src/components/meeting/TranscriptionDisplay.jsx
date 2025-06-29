import React from 'react';

const TranscriptionDisplay = ({ 
  transcriptions = [], 
  showSpeakerDetection = true,
  showConfidence = true 
}) => {
  
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Nu';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getSpeakerDetectionIcon = (speakerDetection) => {
    if (!speakerDetection) return null;
    
    if (speakerDetection.identified && speakerDetection.confidence > 0.7) {
      return '🎯'; // High confidence identification
    } else if (speakerDetection.identified && speakerDetection.confidence > 0.4) {
      return '🤔'; // Medium confidence identification
    } else {
      return '❓'; // Unknown speaker
    }
  };

  const getSpeakerDetectionTooltip = (speakerDetection) => {
    if (!speakerDetection) return '';
    
    return `Spreker herkenning: ${speakerDetection.method} (${Math.round(speakerDetection.confidence * 100)}% zekerheid)`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      {transcriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎤</div>
          <p>Nog geen transcripties...</p>
          <p className="text-sm">Start opname om transcripties te zien</p>
        </div>
      ) : (
        transcriptions.map((transcription) => (
          <div
            key={transcription.id}
            className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            {/* Header met speaker info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {/* Speaker Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: transcription.speaker_color || '#6B7280' }}
                >
                  {(transcription.speaker_name || 'U').charAt(0).toUpperCase()}
                </div>
                
                {/* Speaker Name met Detection Info */}
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800">
                    {transcription.speaker_name || 'Onbekende Spreker'}
                  </span>
                  
                  {/* Speaker Detection Indicator */}
                  {showSpeakerDetection && transcription.speakerDetection && (
                    <span
                      className="text-sm cursor-help"
                      title={getSpeakerDetectionTooltip(transcription.speakerDetection)}
                    >
                      {getSpeakerDetectionIcon(transcription.speakerDetection)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Timestamp en Source */}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{formatTime(transcription.spoken_at || transcription.timestamp)}</span>
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {transcription.source || 'live'}
                </span>
              </div>
            </div>

            {/* Transcription Text */}
            <div className="text-gray-800 leading-relaxed mb-3">
              {transcription.text}
            </div>

            {/* Footer met Confidence en Detection Details */}
            {(showConfidence || showSpeakerDetection) && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center space-x-4">
                  {/* Text Confidence */}
                  {showConfidence && transcription.confidence && (
                    <span className={`${getConfidenceColor(transcription.confidence)}`}>
                      Tekst: {Math.round(transcription.confidence * 100)}%
                    </span>
                  )}
                  
                  {/* Speaker Confidence */}
                  {showSpeakerDetection && transcription.speaker_confidence && (
                    <span className={`${getConfidenceColor(transcription.speaker_confidence)}`}>
                      Spreker: {Math.round(transcription.speaker_confidence * 100)}%
                    </span>
                  )}
                </div>
                
                {/* Processing Status */}
                <div className="flex items-center space-x-2">
                  {transcription.processing_status && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {transcription.processing_status}
                    </span>
                  )}
                  
                  {/* Whisper Improved Indicator */}
                  {transcription.speakerDetection?.improved && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded" title="Tekst verbeterd door Whisper">
                      ✨ Verbeterd
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Debug Info (development only) */}
            {process.env.NODE_ENV === 'development' && transcription.speakerDetection && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer">Debug: Speaker Detection</summary>
                <pre className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(transcription.speakerDetection, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default TranscriptionDisplay;