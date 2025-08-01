import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import { 
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon
} from '@mui/icons-material';
import { Card, Button, Badge, LoadingSpinner, Alert } from '../../../ui';
import AddParticipantModal from './AddParticipantModal';

const ParticipantPanel = ({
  // Props from existing SpeakerPanel pattern
  currentSpeaker,
  setCurrentSpeaker,
  availableSpeakers,
  setAvailableSpeakers,
  speakerStats,
  getSpeakerColor,
  onRefresh,
  isRefreshing = false,
  // Additional props for expanded functionality
  expandedState = true,
  onToggleExpanded,
  // NEW: Props for participant management
  setSpeakerStats
}) => {
  const { id: meetingId } = useParams();
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);

  const handleSpeakerChange = (participant) => {
    if (!isRefreshing && setCurrentSpeaker) {
      setCurrentSpeaker(participant);
      console.log('🎤 Current speaker changed to:', participant.name || participant);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh('speaker'); // Use same refresh method as SpeakerPanel
    }
  };

  const handleAddParticipant = async (participantData) => {
    try {
      setIsAddingParticipant(true);
      console.log('🔨 Adding new participant:', participantData);

      // Generate unique ID for new participant
      const newParticipant = {
        ...participantData,
        id: Date.now(), // Simple ID generation for now
        joinedAt: new Date().toISOString()
      };

      // Add to availableSpeakers list
      if (setAvailableSpeakers) {
        setAvailableSpeakers(prev => [...prev, newParticipant]);
      }

      // Initialize stats for new participant
      if (setSpeakerStats) {
        setSpeakerStats(prev => ({
          ...prev,
          [newParticipant.name]: {
            segments: 0,
            totalTime: 0
          }
        }));
      }

      console.log('✅ Participant added successfully:', newParticipant.name);

      // TODO: Also send to backend
      // await participantService.addParticipant(meetingId, participantData);

    } catch (error) {
      console.error('❌ Failed to add participant:', error);
      throw error;
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const getStatusBadge = (participant) => {
    // Handle both string speakers and object participants
    if (typeof participant === 'string') {
      return <Badge variant="success">Online</Badge>;
    }

    if (participant.isActive) {
      return <Badge variant="success">Online</Badge>;
    }
    
    switch (participant.status) {
      case 'online':
        return <Badge variant="success">Online</Badge>;
      case 'away':
        return <Badge variant="warning">Afwezig</Badge>;
      case 'offline':
        return <Badge variant="error">Offline</Badge>;
      default:
        return <Badge variant="default">Onbekend</Badge>;
    }
  };

  const getParticipantName = (participant) => {
    if (typeof participant === 'string') {
      return participant;
    }
    return participant.displayName || participant.name || 'Onbekende Spreker';
  };

  const getParticipantRole = (participant) => {
    if (typeof participant === 'string') {
      return 'Deelnemer';
    }
    return participant.role || 'Deelnemer';
  };

  const getParticipantId = (participant, index) => {
    if (typeof participant === 'string') {
      return `speaker-${index}`;
    }
    return participant.id || `participant-${index}`;
  };

  const getParticipantStats = (participant) => {
    const name = getParticipantName(participant);
    return speakerStats && speakerStats[name] ? speakerStats[name] : null;
  };

  // Convert availableSpeakers to consistent format
  const participants = availableSpeakers || [];

  return (
    <Card variant="default" padding="md">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            👥 Deelnemers
            <Badge variant="info">{participants.length}</Badge>
          </Typography>
          
          <Button 
            variant="neutral" 
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            <RefreshIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Vernieuw
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Refresh Status Indicator */}
      {isRefreshing && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}>
              <RefreshIcon sx={{ fontSize: 16, color: '#856404' }} />
            </Box>
            <Typography variant="body2" sx={{ color: '#856404' }}>
              Deelnemer gegevens worden vernieuwd...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Current Speaker Section */}
      {currentSpeaker && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #93c5fd' }}>
          <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
            🎤 Huidige Spreker
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: getSpeakerColor ? getSpeakerColor(0) : '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {getParticipantName(currentSpeaker).charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getParticipantName(currentSpeaker)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getParticipantRole(currentSpeaker)}
              </Typography>
            </Box>
            <MicIcon color="primary" sx={{ fontSize: 20 }} />
          </Box>

          {/* Current Speaker Stats */}
          {getParticipantStats(currentSpeaker) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #bfdbfe' }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                📊 Spreektijd Info
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {getParticipantStats(currentSpeaker).segments || 0} segmenten
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(getParticipantStats(currentSpeaker).totalTime || 0)}s spreektijd
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Participants List */}
      <Box sx={{ mb: 3 }}>
        {participants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Nog geen deelnemers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Voeg de eerste deelnemer toe om te beginnen
            </Typography>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowAddModal(true)}
              disabled={isRefreshing}
            >
              <PersonAddIcon sx={{ mr: 1 }} />
              Eerste Deelnemer Toevoegen
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {participants.map((participant, index) => {
              const participantName = getParticipantName(participant);
              const participantRole = getParticipantRole(participant);
              const participantId = getParticipantId(participant, index);
              const participantStats = getParticipantStats(participant);
              const isCurrentSpeaker = currentSpeaker && getParticipantName(currentSpeaker) === participantName;

              return (
                <ListItem 
                  key={participantId}
                  sx={{ 
                    px: 0, 
                    py: 1,
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: isCurrentSpeaker ? '#3b82f6' : '#e5e7eb',
                    bgcolor: isCurrentSpeaker ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: isCurrentSpeaker ? '#eff6ff' : '#f8fafc',
                      borderColor: '#3b82f6'
                    },
                    transition: 'all 0.2s ease',
                    ...(isRefreshing && { opacity: 0.6 })
                  }}
                  onClick={() => handleSpeakerChange(participant)}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: getSpeakerColor ? getSpeakerColor(index) : '#3b82f6',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {participantName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {participantName}
                        </Typography>
                        {isCurrentSpeaker && (
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            bgcolor: '#10b981', 
                            borderRadius: '50%',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1 },
                              '50%': { opacity: 0.5 }
                            }
                          }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {participantRole}
                        </Typography>
                        {participantStats && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • {participantStats.segments || 0} segmenten • {Math.round(participantStats.totalTime || 0)}s
                          </Typography>
                        )}
                      </Box>
                    }
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    {getStatusBadge(participant)}
                    
                    {isCurrentSpeaker ? (
                      <MicIcon sx={{ fontSize: 16, color: '#10b981' }} />
                    ) : (
                      <MicOffIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                    )}
                  </Box>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Speaking Time Statistics */}
      {speakerStats && Object.keys(speakerStats).length > 0 && (
        <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            📊 Spreektijd Verdeling
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(speakerStats)
              .sort(([,a], [,b]) => (b.totalTime || 0) - (a.totalTime || 0))
              .slice(0, 4)
              .map(([speakerName, stats], index) => {
                const totalTime = Object.values(speakerStats).reduce((sum, s) => sum + (s.totalTime || 0), 0);
                const percentage = totalTime > 0 ? Math.round(((stats.totalTime || 0) / totalTime) * 100) : 0;
                
                return (
                  <Box key={speakerName} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getSpeakerColor ? getSpeakerColor(index) : '#3b82f6',
                        flexShrink: 0
                      }}
                    />
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {speakerName.length > 20 ? `${speakerName.substring(0, 20)}...` : speakerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {percentage}% • {Math.round(stats.totalTime || 0)}s
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        width: '100%', 
                        height: 3, 
                        bgcolor: '#e5e7eb', 
                        borderRadius: 1,
                        overflow: 'hidden',
                        mt: 0.5
                      }}>
                        <Box sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: getSpeakerColor ? getSpeakerColor(index) : '#3b82f6',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </Box>
      )}

      {/* Quick Speaker Switch */}
      {participants.length > 1 && (
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            ⚡ Snel Wisselen
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {participants.slice(0, 4).map((participant, index) => {
              const participantName = getParticipantName(participant);
              const isCurrentSpeaker = currentSpeaker && getParticipantName(currentSpeaker) === participantName;
              
              return (
                <Button
                  key={getParticipantId(participant, index)}
                  variant={isCurrentSpeaker ? "primary" : "neutral"}
                  size="sm"
                  onClick={() => handleSpeakerChange(participant)}
                  disabled={isRefreshing}
                  sx={{ 
                    minWidth: 40,
                    ...(isRefreshing && { opacity: 0.5 })
                  }}
                >
                  {participantName.charAt(0).toUpperCase()}
                </Button>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Show More Participants */}
      {participants.length > 4 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="neutral" size="sm" fullWidth disabled={isRefreshing}>
            Toon alle {participants.length} deelnemers →
          </Button>
        </Box>
      )}

      {/* Quick Actions - Only show when there are participants */}
      {participants.length > 0 && (
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button 
            variant="primary" 
            size="sm" 
            fullWidth
            onClick={() => setShowAddModal(true)}
            disabled={isRefreshing}
          >
            <PersonAddIcon sx={{ mr: 1 }} />
            Nieuwe Deelnemer Toevoegen
          </Button>
        </Box>
      )}

      {/* Add Participant Modal */}
      <AddParticipantModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddParticipant={handleAddParticipant}
        isAdding={isAddingParticipant}
      />

      {/* Loading skeleton when refreshing */}
      {isRefreshing && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ 
              height: 40, 
              bgcolor: '#f1f5f9', 
              borderRadius: 2,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
              }
            }} />
          ))}
        </Box>
      )}
    </Card>
  );
};

export default ParticipantPanel;