// ConversationHub - AudioPanel Component
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Card, Button, Badge, Alert, LoadingSpinner } from '../../../ui';
import { useAudioRecorder } from './useAudioRecorder';
import AudioWaveform from './AudioWaveform';

const AudioPanel = () => {
  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    chunksProcessed,
    n8nConnected,
    lastChunkSent,
    audioQuality,
    chunkInterval,
    error,
    processingChunk,
    processingFinalAudio,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setAudioQuality,
    setChunkInterval,
    setError
  } = useAudioRecorder();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="default" padding="md">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🎙️ Audio Opname
          <Badge variant={
            isRecording && !isPaused ? 'success' : 
            isPaused ? 'warning' : 'default'
          }>
            {isRecording && !isPaused ? 'Actief' : 
             isPaused ? 'Gepauzeerd' : 'Inactief'}
          </Badge>
        </Typography>
      </Box>

      {/* Recording Controls */}
      <Box sx={{ mb: 3 }}>
        {!isRecording ? (
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={startRecording}
            loading={processingChunk}
          >
            ▶️ Start Opname
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant={isPaused ? 'secondary' : 'warning'}
              size="lg"
              fullWidth
              onClick={isPaused ? resumeRecording : pauseRecording}
              disabled={processingChunk || processingFinalAudio}
            >
              {isPaused ? '▶️ Hervatten' : '⏸️ Pauzeer'}
            </Button>
            
            <Button 
              variant="danger"
              size="lg"
              fullWidth
              onClick={stopRecording}
              loading={processingFinalAudio}
            >
              🛑 Stop & Verstuur
            </Button>
          </Box>
        )}
      </Box>

      {/* Recording Status */}
      {isRecording && (
        <Box sx={{ mb: 3, p: 2, bgcolor: isPaused ? '#fff7ed' : '#f0f9ff', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPaused ? 
              `⏸️ Opname gepauzeerd om ${formatTime(duration)}` :
              `🔴 Opname loopt... ${formatTime(duration)}`
            }
          </Typography>
        </Box>
      )}

      {/* Audio Visualization */}
      <Box sx={{ mb: 3, height: 80, bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
        <AudioWaveform 
          isRecording={isRecording && !isPaused} 
          audioLevel={audioLevel}
          isPaused={isPaused}
        />
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h6" color="primary">
              {formatTime(duration)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totale Tijd
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h6" color="secondary">
              {chunksProcessed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Chunks Verzonden
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h6" color={isPaused ? 'warning.main' : 'info.main'}>
              {isPaused ? '⏸️' : (isRecording ? '🔴' : '⚫')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* N8N Status */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            N8N Verbinding
          </Typography>
          <Badge variant={n8nConnected ? 'success' : 'error'}>
            {n8nConnected ? 'Verbonden' : 'Niet verbonden'}
          </Badge>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Laatste chunk verzonden:
          </Typography>
          <Typography variant="caption">
            {lastChunkSent || 'Nog niet verzonden'}
          </Typography>
        </Box>
      </Box>

      {/* Processing Status */}
      {processingFinalAudio && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="info">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LoadingSpinner size="sm" />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Finale audio wordt verwerkt...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete opname wordt naar N8N verzonden voor verdere verwerking
                </Typography>
              </Box>
            </Box>
          </Alert>
        </Box>
      )}

      {/* Error Messages */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {processingChunk && !processingFinalAudio && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
          <LoadingSpinner size="sm" />
          <Typography variant="caption">
            Audio chunk wordt naar N8N verzonden...
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default AudioPanel;