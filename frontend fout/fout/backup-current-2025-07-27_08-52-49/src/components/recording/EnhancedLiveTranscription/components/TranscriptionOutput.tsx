import React, { useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Chip, 
  Tooltip, 
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { 
  Mic, 
  Psychology, 
  Cloud, 
  AccessTime,
  VolumeUp,
  SignalCellularAlt
} from '@mui/icons-material';
import type { TranscriptionOutputProps, LiveTranscription, TranscriptionSource } from '../types';

/**
 * TranscriptionOutput Component
 * Displays live transcription results with speaker identification and confidence scores
 */
const TranscriptionOutput: React.FC<TranscriptionOutputProps> = ({
  transcriptions,
  isLoading,
  error,
  showConfidence = true,
  showSpeakerDetection = true
}) => {
  const transcriptionsEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to latest transcription
   */
  useEffect(() => {
    if (transcriptionsEndRef.current) {
      transcriptionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions]);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  /**
   * Get source icon and color
   */
  const getSourceInfo = (source: TranscriptionSource) => {
    switch (source) {
      case 'live':
        return { icon: <Mic />, color: '#4CAF50', label: 'Live Browser' };
      case 'whisper':
        return { icon: <Psychology />, color: '#2196F3', label: 'Whisper AI' };
      case 'n8n':
        return { icon: <Cloud />, color: '#9C27B0', label: 'N8N Workflow' };
      case 'background':
        return { icon: <Cloud />, color: '#FF9800', label: 'Achtergrond' };
      default:
        return { icon: <VolumeUp />, color: '#607D8B', label: 'Onbekend' };
    }
  };

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  /**
   * Get speaker avatar background color (consistent per speaker)
   */
  const getSpeakerColor = (speakerId: string, speakerColor?: string): string => {
    if (speakerColor) return speakerColor;
    
    // Generate consistent color based on speaker ID hash
    let hash = 0;
    for (let i = 0; i < speakerId.length; i++) {
      hash = speakerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B', '#E91E63', '#00BCD4'];
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Render empty state
   */
  if (transcriptions.length === 0 && !isLoading) {
    return (
      <Card className="modern-card" data-testid="transcription-empty-state">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <Mic sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nog geen transcripties...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start opname om transcripties te zien
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Transcriptie Fout:</strong> {error}
        </Typography>
      </Alert>
    );
  }

  return (
    <Box data-testid="transcription-output">
      {/* Header */}
      <Card className="modern-card mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📝 Live Transcriptie
            </Typography>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    Verwerken...
                  </Typography>
                </div>
              )}
              <Chip
                label={`${transcriptions.length} transcripties`}
                size="small"
                variant="outlined"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcriptions List */}
      <Box className="space-y-3 max-h-96 overflow-y-auto">
        {transcriptions.map((transcription, index) => {
          const sourceInfo = getSourceInfo(transcription.source);
          const speakerColor = getSpeakerColor(transcription.speaker_id, transcription.speaker_color);
          
          return (
            <Card 
              key={transcription.id || index} 
              className="modern-card hover:shadow-md transition-shadow"
              data-testid="transcription-item"
            >
              <CardContent className="p-4">
                {/* Header with Speaker and Metadata */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* Speaker Avatar */}
                    <Avatar
                      sx={{ 
                        bgcolor: speakerColor,
                        width: 40,
                        height: 40,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {(transcription.speaker_name || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    
                    {/* Speaker Info */}
                    <div>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {transcription.speaker_name || 'Onbekende Spreker'}
                      </Typography>
                      <div className="flex items-center space-x-2">
                        <Tooltip title={`Bron: ${sourceInfo.label}`}>
                          <Chip
                            icon={sourceInfo.icon}
                            label={sourceInfo.label}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: sourceInfo.color,
                              color: sourceInfo.color,
                              '& .MuiChip-icon': { color: sourceInfo.color }
                            }}
                          />
                        </Tooltip>
                        
                        {showConfidence && (
                          <Tooltip title={`Betrouwbaarheid: ${Math.round(transcription.confidence * 100)}%`}>
                            <Chip
                              icon={<SignalCellularAlt />}
                              label={`${Math.round(transcription.confidence * 100)}%`}
                              size="small"
                              color={getConfidenceColor(transcription.confidence)}
                              variant="outlined"
                              data-testid="confidence-score"
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="inherit" />
                      {formatTimestamp(transcription.spoken_at)}
                    </Typography>
                  </div>
                </div>

                {/* Transcription Text */}
                <Box sx={{ pl: 6.5 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.6,
                      fontSize: '1.1rem',
                      wordBreak: 'break-word'
                    }}
                  >
                    {transcription.text}
                  </Typography>

                  {/* Processing Status */}
                  {transcription.processing_status && transcription.processing_status !== 'completed' && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <div className="flex items-center space-x-2">
                        {transcription.processing_status === 'processing' && (
                          <CircularProgress size={16} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Status: {transcription.processing_status === 'processing' ? 'Wordt verwerkt...' : transcription.processing_status}
                        </Typography>
                      </div>
                    </Box>
                  )}

                  {/* Speaker Detection Info */}
                  {showSpeakerDetection && transcription.speaker_id && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Speaker ID: {transcription.speaker_id}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {/* Loading indicator for new transcriptions */}
        {isLoading && (
          <Card className="modern-card border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CircularProgress size={24} />
                <div>
                  <Typography variant="body2" color="text.secondary">
                    Nieuwe transcriptie wordt verwerkt...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Audio wordt geanalyseerd door AI
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scroll anchor */}
        <div ref={transcriptionsEndRef} />
      </Box>

      {/* Statistics Footer */}
      {transcriptions.length > 0 && (
        <Card className="modern-card mt-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Typography variant="caption" color="text.secondary">
                    Totaal: {transcriptions.length} transcripties
                  </Typography>
                </div>
                
                {showConfidence && (
                  <div className="flex items-center space-x-1">
                    <Typography variant="caption" color="text.secondary">
                      Gem. betrouwbaarheid: {Math.round(
                        transcriptions.reduce((acc, t) => acc + t.confidence, 0) / transcriptions.length * 100
                      )}%
                    </Typography>
                  </div>
                )}
              </div>

              {/* Source breakdown */}
              <div className="flex items-center space-x-2">
                {['live', 'whisper', 'n8n'].map(source => {
                  const count = transcriptions.filter(t => t.source === source).length;
                  if (count === 0) return null;
                  
                  const sourceInfo = getSourceInfo(source as TranscriptionSource);
                  return (
                    <Tooltip key={source} title={`${sourceInfo.label}: ${count} transcripties`}>
                      <Chip
                        icon={sourceInfo.icon}
                        label={count}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: sourceInfo.color,
                          color: sourceInfo.color,
                          '& .MuiChip-icon': { color: sourceInfo.color }
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TranscriptionOutput;