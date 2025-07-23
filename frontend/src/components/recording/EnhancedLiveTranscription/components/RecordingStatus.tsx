import React from 'react';
import { Box, Card, CardContent, Typography, Chip, LinearProgress, Grid } from '@mui/material';
import { 
  AccessTime, 
  GraphicEq, 
  Psychology, 
  CloudQueue, 
  SignalCellularAlt,
  Error as ErrorIcon,
  CheckCircle 
} from '@mui/icons-material';
import type { RecordingStatusProps } from '../types';

/**
 * RecordingStatus Component
 * Displays recording status, statistics, and processing information
 */
const RecordingStatus: React.FC<RecordingStatusProps> = ({
  recordingState,
  sessionStats,
  audioProcessingState,
  config
}) => {
  /**
   * Format time in HH:MM:SS or MM:SS format
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get confidence color based on average confidence
   */
  const getConfidenceColor = (confidence: number): 'success' | 'warning' | 'error' => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  /**
   * Get service status color
   */
  const getServiceStatusColor = (service: string): string => {
    switch (service) {
      case 'whisper': return '#2196F3';
      case 'n8n': return '#9C27B0';
      case 'auto': return '#4CAF50';
      default: return '#607D8B';
    }
  };

  /**
   * Calculate processing rate (transcriptions per minute)
   */
  const getProcessingRate = (): number => {
    if (sessionStats.totalDuration === 0) return 0;
    return Math.round((sessionStats.transcriptionsReceived / (sessionStats.totalDuration / 60)) * 100) / 100;
  };

  return (
    <Box className="space-y-4" data-testid="recording-status">
      {/* Main Status Card */}
      <Card className="modern-card">
        <CardContent className="p-6">
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GraphicEq />
            Recording Status
          </Typography>

          <Grid container spacing={3}>
            {/* Recording Duration */}
            <Grid item xs={12} sm={6} md={3}>
              <Box className="text-center p-4 bg-gray-50 rounded-lg">
                <AccessTime sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" component="div" className="font-mono">
                  {formatTime(recordingState.recordingTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Opnameduur
                </Typography>
              </Box>
            </Grid>

            {/* Chunks Processed */}
            <Grid item xs={12} sm={6} md={3}>
              <Box className="text-center p-4 bg-gray-50 rounded-lg">
                <CloudQueue sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {audioProcessingState.chunksProcessed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Chunks Verwerkt
                </Typography>
              </Box>
            </Grid>

            {/* Transcriptions Received */}
            <Grid item xs={12} sm={6} md={3}>
              <Box className="text-center p-4 bg-gray-50 rounded-lg">
                <Psychology sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {sessionStats.transcriptionsReceived}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Transcripties
                </Typography>
              </Box>
            </Grid>

            {/* Average Confidence */}
            <Grid item xs={12} sm={6} md={3}>
              <Box className="text-center p-4 bg-gray-50 rounded-lg">
                <SignalCellularAlt sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {Math.round(sessionStats.averageConfidence * 100)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gem. Betrouwbaarheid
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <Card className="modern-card">
        <CardContent className="p-6">
          <Typography variant="h6" gutterBottom>
            📊 Gedetailleerde Statistieken
          </Typography>

          <Grid container spacing={3}>
            {/* Processing Information */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Verwerking
                </Typography>
                
                <div className="space-y-3">
                  {/* Active Service */}
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">Actieve Service:</Typography>
                    <Chip
                      label={sessionStats.activeService.toUpperCase()}
                      size="small"
                      sx={{ 
                        backgroundColor: getServiceStatusColor(sessionStats.activeService),
                        color: 'white'
                      }}
                      data-testid="active-service"
                    />
                  </div>

                  {/* Processing Rate */}
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">Verwerkingssnelheid:</Typography>
                    <Typography variant="body2" className="font-mono">
                      {getProcessingRate()} transcripties/min
                    </Typography>
                  </div>

                  {/* Whisper Calls */}
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">Whisper API Calls:</Typography>
                    <Typography variant="body2" className="font-mono" data-testid="whisper-calls">
                      {sessionStats.whisperCalls}
                    </Typography>
                  </div>

                  {/* Error Count */}
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">Fouten:</Typography>
                    <Chip
                      label={sessionStats.errorCount}
                      size="small"
                      color={sessionStats.errorCount > 0 ? 'error' : 'success'}
                      variant="outlined"
                    />
                  </div>
                </div>
              </Box>
            </Grid>

            {/* Quality Metrics */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Kwaliteit
                </Typography>
                
                <div className="space-y-3">
                  {/* Confidence Score */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Typography variant="body2">Betrouwbaarheid:</Typography>
                      <Typography variant="body2" className="font-mono">
                        {Math.round(sessionStats.averageConfidence * 100)}%
                      </Typography>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={sessionStats.averageConfidence * 100}
                      color={getConfidenceColor(sessionStats.averageConfidence)}
                      sx={{ height: 8, borderRadius: 4 }}
                      data-testid="confidence-score"
                    />
                  </div>

                  {/* Speech Recognition Support */}
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">Browser Speech:</Typography>
                    <Chip
                      icon={recordingState.speechSupported ? <CheckCircle /> : <ErrorIcon />}
                      label={recordingState.speechSupported ? 'Ondersteund' : 'Niet Beschikbaar'}
                      size="small"
                      color={recordingState.speechSupported ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </div>

                  {/* Chunk Duration */}
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">Chunk Duur:</Typography>
                    <Typography variant="body2" className="font-mono">
                      {config.whisper_chunk_duration}s
                    </Typography>
                  </div>

                  {/* Last Processing */}
                  {audioProcessingState.lastChunkTime && (
                    <div className="flex justify-between items-center">
                      <Typography variant="body2">Laatste Verwerking:</Typography>
                      <Typography variant="body2" className="font-mono">
                        {new Date(audioProcessingState.lastChunkTime).toLocaleTimeString('nl-NL')}
                      </Typography>
                    </div>
                  )}
                </div>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Background Processing Indicator */}
      {audioProcessingState.isProcessingBackground && (
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin">
                <CloudQueue sx={{ color: 'info.main' }} />
              </div>
              <div className="flex-1">
                <Typography variant="body2" gutterBottom>
                  🤖 Achtergrond verwerking actief...
                </Typography>
                <LinearProgress color="info" sx={{ height: 4, borderRadius: 2 }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(recordingState.error || audioProcessingState.processingError) && (
        <Card className="modern-card border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <ErrorIcon sx={{ color: 'error.main', mt: 0.5 }} />
              <div>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Verwerkingsfout
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {recordingState.error || audioProcessingState.processingError}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Configuration Info */}
      <Card className="modern-card">
        <CardContent className="p-4">
          <Typography variant="subtitle2" gutterBottom>
            🔧 Service Configuratie
          </Typography>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Live WebSpeech:</span>
              <Chip
                label={config.live_webspeech_enabled ? 'Aan' : 'Uit'}
                size="small"
                color={config.live_webspeech_enabled ? 'success' : 'default'}
                variant="outlined"
              />
            </div>
            
            <div className="flex justify-between">
              <span>Whisper API:</span>
              <Chip
                label={config.whisper_enabled ? 'Aan' : 'Uit'}
                size="small"
                color={config.whisper_enabled ? 'success' : 'default'}
                variant="outlined"
              />
            </div>
            
            <div className="flex justify-between">
              <span>N8N Processing:</span>
              <Chip
                label={config.n8n_transcription_enabled ? 'Aan' : 'Uit'}
                size="small"
                color={config.n8n_transcription_enabled ? 'success' : 'default'}
                variant="outlined"
              />
            </div>
            
            <div className="flex justify-between">
              <span>Default Service:</span>
              <Typography variant="body2" className="font-mono">
                {config.default_transcription_service.toUpperCase()}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RecordingStatus;