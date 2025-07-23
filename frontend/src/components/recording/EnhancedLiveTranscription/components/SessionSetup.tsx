import React from 'react';
import { Box, Button, Typography, Card, CardContent, List, ListItem, ListItemText, Avatar, CircularProgress, Alert } from '@mui/material';
import { Mic, VolumeUp, Settings, PlayArrow, SkipNext } from '@mui/icons-material';
import type { SessionSetupProps } from '../types';

/**
 * SessionSetup Component
 * Handles session initialization and voice profile setup
 */
const SessionSetup: React.FC<SessionSetupProps> = ({
  participants,
  voiceSetupState,
  sessionState,
  onStartSession,
  onVoiceSetupNext,
  onVoiceSetupSkip,
  onRetry
}) => {
  /**
   * Get participant avatar color
   */
  const getParticipantColor = (index: number): string => {
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B'];
    return colors[index % colors.length];
  };

  /**
   * Render loading state during session start
   */
  if (sessionState.isStartingSession) {
    return (
      <Box className="modern-card p-8" data-testid="session-setup-loading">
        <div className="text-center">
          <CircularProgress size={48} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Session Starten...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {sessionState.startupProgress || 'Initialiseren...'}
          </Typography>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: sessionState.startupProgress.includes('Verbinden') ? '75%' : 
                       sessionState.startupProgress.includes('verwerken') ? '50%' : '25%' 
              }}
            />
          </div>
        </div>
      </Box>
    );
  }

  /**
   * Render error state
   */
  if (sessionState.error) {
    return (
      <Box className="modern-card p-8" data-testid="session-setup-error">
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Sessie Start Fout:</strong> {sessionState.error}
          </Typography>
        </Alert>
        
        <div className="text-center">
          <Button
            variant="contained"
            color="primary"
            onClick={onRetry}
            startIcon={<PlayArrow />}
            sx={{ px: 4, py: 2 }}
            data-testid="retry-button"
          >
            Opnieuw Proberen
          </Button>
        </div>
      </Box>
    );
  }

  /**
   * Render voice setup error state
   */
  if (voiceSetupState.voiceSetupError) {
    return (
      <Box className="modern-card p-8" data-testid="voice-setup-error">
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Stem Setup Fout:</strong> {voiceSetupState.voiceSetupError}
          </Typography>
        </Alert>
        
        <div className="flex justify-center space-x-4">
          <Button
            variant="outlined"
            onClick={onVoiceSetupSkip}
            data-testid="voice-setup-skip-button"
          >
            Overslaan
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onStartSession(false)}
            data-testid="continue-without-voice-button"
          >
            Verder Zonder Stemherkenning
          </Button>
        </div>
      </Box>
    );
  }

  /**
   * Render main session setup interface
   */
  return (
    <Box className="space-y-6" data-testid="session-setup">
      {/* Header */}
      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Mic sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Enhanced Live Transcription
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Start een intelligente transcriptie sessie met spraakherkenning
            </Typography>
          </div>

          {/* Participants List */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              👥 Deelnemers ({participants.length})
            </Typography>
            
            {participants.length > 0 ? (
              <List dense>
                {participants.map((participant, index) => (
                  <ListItem key={participant.id || index} sx={{ px: 0 }}>
                    <Avatar
                      sx={{ 
                        bgcolor: getParticipantColor(index),
                        mr: 2,
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem'
                      }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={participant.name}
                      secondary={participant.role || 'Deelnemer'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Geen deelnemers gevonden. Voeg deelnemers toe voordat je de sessie start.
              </Alert>
            )}
          </Box>

          {/* Session Start Options */}
          {participants.length > 0 && (
            <div className="space-y-4">
              {/* Standard Start */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="subtitle1" gutterBottom>
                      🚀 Standaard Start
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Begin direct met transcriptie zonder stemherkenning setup
                    </Typography>
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => onStartSession(false)}
                    startIcon={<PlayArrow />}
                    sx={{ px: 4, py: 2 }}
                    data-testid="start-session-button"
                  >
                    Start Sessie
                  </Button>
                </div>
              </div>

              {/* Voice Setup Start */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="subtitle1" gutterBottom>
                      🎤 Met Stemherkenning
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Setup stemprofielen voor betere spreker identificatie
                    </Typography>
                  </div>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => onStartSession(true)}
                    startIcon={<VolumeUp />}
                    sx={{ px: 4, py: 2 }}
                    data-testid="start-session-voice-button"
                  >
                    Start Met Stemsetup
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Features Info */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings fontSize="small" />
              Beschikbare Functies
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Typography variant="body2">Real-time Transcriptie</Typography>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <Typography variant="body2">Azure Whisper AI</Typography>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <Typography variant="body2">Speaker Identificatie</Typography>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <Typography variant="body2">Privacy Filtering</Typography>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <Typography variant="body2">N8N Workflow Export</Typography>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <Typography variant="body2">GDPR Compliant</Typography>
              </div>
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Voice Setup Progress (if active) */}
      {voiceSetupState.setupPhase === 'voice_setup' && (
        <Card className="modern-card" data-testid="voice-setup-progress">
          <CardContent className="p-6">
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎤 Stem Profiel Setup
            </Typography>
            
            <div className="mb-4">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Spreker {voiceSetupState.currentSetupSpeaker + 1} van {participants.length}: 
                <strong> {participants[voiceSetupState.currentSetupSpeaker]?.name}</strong>
              </Typography>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((voiceSetupState.currentSetupSpeaker + 1) / participants.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {voiceSetupState.isRecordingVoice ? (
              /* Recording Active State */
              <div className="text-center py-4">
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  🔴 Opname Actief
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zeg enkele zinnen duidelijk voor stemherkenning...
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  De opname stopt automatisch na 10 seconden
                </Typography>
              </div>
            ) : (
              /* Recording Control State */
              <div className="text-center space-y-4">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Neem een kort stemvoorbeeld op voor betere spreker identificatie
                </Typography>
                
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onVoiceSetupNext}
                    startIcon={<Mic />}
                    disabled={voiceSetupState.isRecordingVoice}
                    data-testid="record-voice-button"
                  >
                    Start Stem Opname
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={onVoiceSetupSkip}
                    startIcon={<SkipNext />}
                    disabled={voiceSetupState.isRecordingVoice}
                    data-testid="voice-setup-skip-button"
                  >
                    Overslaan
                  </Button>
                </div>

                {/* Skip All Option */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="text"
                    color="secondary"
                    onClick={onVoiceSetupSkip}
                    size="small"
                    data-testid="voice-setup-skip-all-button"
                  >
                    Alle Stemsetup Overslaan
                  </Button>
                </div>
              </div>
            )}

            {/* Voice Setup Instructions */}
            <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                💡 Tips voor Beste Resultaten:
              </Typography>
              <ul className="text-sm space-y-1 mt-2">
                <li>• Spreek duidelijk en in normale snelheid</li>
                <li>• Vermijd achtergrondgeluid tijdens opname</li>
                <li>• Zeg een volledige zin of twee</li>
                <li>• Gebruik je normale spreektoon</li>
              </ul>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Browser Requirements Warning */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Browser Vereisten:</strong> Deze functie werkt het beste in Chrome, Firefox of Edge. 
          Zorg ervoor dat microfoon toegang is toegestaan.
        </Typography>
      </Alert>
    </Box>
  );
};

export default SessionSetup;