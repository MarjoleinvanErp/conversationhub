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

const ParticipantPanel = () => {
  const { id: meetingId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [speakerStats, setSpeakerStats] = useState({});

  // Load participants on mount
  useEffect(() => {
    loadParticipants();
  }, [meetingId]);

  const loadParticipants = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading participants for meeting:', meetingId);
      
      // TODO: Replace with actual API call
      // For now, use enhanced mock data based on your structure
      const mockParticipants = [
        {
          id: 1,
          name: 'Jan van der Berg',
          displayName: 'Jan van der Berg',
          role: 'Moderator',
          isActive: true,
          isParticipant: true,
          status: 'online',
          joinedAt: new Date(Date.now() - 300000).toISOString(),
          speakingTime: 145,
          segments: 8
        },
        {
          id: 2,
          name: 'Maria Pietersen',
          displayName: 'Maria Pietersen', 
          role: 'Deelnemer',
          isActive: true,
          isParticipant: true,
          status: 'online',
          joinedAt: new Date(Date.now() - 240000).toISOString(),
          speakingTime: 89,
          segments: 5
        },
        {
          id: 3,
          name: 'Peter de Vries',
          displayName: 'Peter de Vries',
          role: 'Deelnemer',
          isActive: false,
          isParticipant: true,
          status: 'away',
          joinedAt: new Date(Date.now() - 180000).toISOString(),
          speakingTime: 34,
          segments: 2
        },
        {
          id: 4,
          name: 'Lisa Jansen',
          displayName: 'Lisa Jansen',
          role: 'Notulist',
          isActive: true,
          isParticipant: true,
          status: 'online',
          joinedAt: new Date(Date.now() - 120000).toISOString(),
          speakingTime: 67,
          segments: 4
        }
      ];

      setParticipants(mockParticipants);
      
      // Set initial current speaker to first active participant
      const activeSpeaker = mockParticipants.find(p => p.isActive);
      if (activeSpeaker) {
        setCurrentSpeaker(activeSpeaker);
      }

      // Calculate speaker stats
      const stats = {};
      mockParticipants.forEach(participant => {
        stats[participant.name] = {
          segments: participant.segments || 0,
          totalTime: participant.speakingTime || 0
        };
      });
      setSpeakerStats(stats);

      console.log('✅ Loaded', mockParticipants.length, 'participants');

    } catch (err) {
      console.error('❌ Failed to load participants:', err);
      setError('Kon deelnemers niet laden: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshParticipants = async () => {
    try {
      setIsRefreshing(true);
      await loadParticipants();
      console.log('✅ Participants refreshed successfully');
    } catch (err) {
      console.error('❌ Failed to refresh participants:', err);
      setError('Kon deelnemers niet vernieuwen: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSpeakerChange = (participant) => {
    if (!isRefreshing) {
      setCurrentSpeaker(participant);
      console.log('🎤 Current speaker changed to:', participant.name);
      
      // TODO: Update current speaker in backend
      // await participantService.setCurrentSpeaker(meetingId, participant.id);
    }
  };

  const getSpeakerColor = (index) => {
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Emerald  
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#ec4899'  // Pink
    ];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status, isActive) => {
    if (isActive) {
      return <Badge variant="success">Online</Badge>;
    }
    
    switch (status) {
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

  if (isLoading) {
    return (
      <Card variant="default" padding="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <LoadingSpinner size="md">Deelnemers laden...</LoadingSpinner>
        </Box>
      </Card>
    );
  }

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
            onClick={refreshParticipants}
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
                bgcolor: getSpeakerColor(0),
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {currentSpeaker.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {currentSpeaker.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentSpeaker.role}
              </Typography>
            </Box>
            <MicIcon color="primary" sx={{ fontSize: 20 }} />
          </Box>
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
            <Button variant="primary" size="sm">
              <PersonAddIcon sx={{ mr: 1 }} />
              Deelnemer Uitnodigen
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {participants.map((participant, index) => (
              <ListItem 
                key={participant.id}
                sx={{ 
                  px: 0, 
                  py: 1,
                  borderRadius: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: currentSpeaker?.id === participant.id ? '#3b82f6' : '#e5e7eb',
                  bgcolor: currentSpeaker?.id === participant.id ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  '&:hover': { 
                    bgcolor: currentSpeaker?.id === participant.id ? '#eff6ff' : '#f8fafc',
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
                      bgcolor: getSpeakerColor(index),
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    {participant.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {participant.name}
                      </Typography>
                      {currentSpeaker?.id === participant.id && (
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: '#10b981', 
                          borderRadius: '50%',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {participant.role}
                      </Typography>
                      {participant.speakingTime > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          • {participant.segments} segmenten • {Math.round(participant.speakingTime)}s
                        </Typography>
                      )}
                    </Box>
                  }
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  {getStatusBadge(participant.status, participant.isActive)}
                  
                  {participant.isActive ? (
                    <MicIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  ) : (
                    <MicOffIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Speaking Time Statistics */}
      {Object.keys(speakerStats).length > 0 && (
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
                        bgcolor: getSpeakerColor(index),
                        flexShrink: 0
                      }}
                    />
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {speakerName}
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
                          bgcolor: getSpeakerColor(index),
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

      {/* Quick Actions */}
      <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e5e7eb' }}>
        <Button variant="neutral" size="sm" fullWidth>
          <PersonAddIcon sx={{ mr: 1 }} />
          Deelnemer Uitnodigen
        </Button>
      </Box>
    </Card>
  );
};

export default ParticipantPanel;