import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Divider,
  Container,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import meetingService from '../../services/api/meetingService.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const result = await meetingService.getAllMeetings();
      if (result.success) {
        setMeetings(result.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter meetings based on status
  const openMeetings = meetings.filter(meeting => 
    meeting.status === 'scheduled' || meeting.status === 'active'
  );
  
  const closedMeetings = meetings.filter(meeting => 
    meeting.status === 'completed' || meeting.status === 'cancelled'
  );

  const getStatusChip = (status) => {
    const statusConfig = {
      scheduled: { 
        color: 'info', 
        label: 'Gepland',
        bgcolor: '#e3f2fd',
        textColor: '#1565c0'
      },
      active: { 
        color: 'success', 
        label: 'Actief',
        bgcolor: '#e8f5e8',
        textColor: '#2e7d32'
      },
      completed: { 
        color: 'default', 
        label: 'Voltooid',
        bgcolor: '#f5f5f5',
        textColor: '#616161'
      },
      cancelled: { 
        color: 'error', 
        label: 'Geannuleerd',
        bgcolor: '#ffebee',
        textColor: '#c62828'
      },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bgcolor,
          color: config.textColor,
          fontWeight: 500,
          fontSize: '0.75rem',
        }}
        size="small"
      />
    );
  };

  const getTypeInfo = (type) => {
    const types = {
      general: { label: 'Algemeen', icon: '💼', color: '#64748b' },
      participation: { label: 'Participatie', icon: '🤝', color: '#3b82f6' },
      care: { label: 'Zorg', icon: '❤️', color: '#ef4444' },
      education: { label: 'Onderwijs', icon: '🎓', color: '#8b5cf6' },
    };
    
    return types[type] || types.general;
  };

  const renderMeetingSection = (meetings, title, emptyMessage, emptyIcon, showCreateButton = false) => (
    <Box sx={{ mb: 4 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          📋 {title}
          <Chip 
            label={meetings.length}
            size="small"
            sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 500 }}
          />
        </Typography>
        {showCreateButton && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/meetings/create')}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            Nieuw Gesprek
          </Button>
        )}
      </Box>

      {/* Meetings Grid */}
      {meetings.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, bgcolor: '#f8fafc' }}>
          <CardContent>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
              {emptyIcon}
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748b', mb: 2, fontWeight: 500 }}>
              {emptyMessage}
            </Typography>
            {showCreateButton && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Begin vandaag nog met je eerste intelligente gesprek!
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/meetings/create')}
                  size="large"
                  sx={{
                    backgroundColor: '#3b82f6',
                    '&:hover': { backgroundColor: '#2563eb' },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Eerste Gesprek Aanmaken
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {meetings.map((meeting) => {
            const typeInfo = getTypeInfo(meeting.type);
            
            return (
              <Grid item xs={12} lg={6} key={meeting.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: meeting.status === 'active' ? '2px solid #10b981' : '1px solid #e5e7eb',
                    '&:hover': { 
                      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <CardContent>
                    {/* Meeting Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#1e293b',
                          flexGrow: 1,
                          mr: 2
                        }}
                      >
                        {meeting.title}
                      </Typography>
                      {getStatusChip(meeting.status)}
                    </Box>

                    {/* Meeting Type */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: typeInfo.color,
                          bgcolor: `${typeInfo.color}15`,
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          fontWeight: 500
                        }}
                      >
                        <span>{typeInfo.icon}</span>
                        {typeInfo.label}
                      </Typography>
                    </Box>

                    {/* Meeting Stats */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GroupIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" color="text.secondary">
                          {meeting.participants?.length || 0} deelnemers
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AssignmentIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" color="text.secondary">
                          {meeting.agenda_items?.length || 0} agenda punten
                        </Typography>
                      </Box>

                      {meeting.scheduled_at && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(meeting.scheduled_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Participants Avatars */}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {meeting.participants.slice(0, 4).map((participant, index) => (
                          <Avatar
                            key={participant.id || index}
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              fontSize: '0.75rem',
                              bgcolor: '#3b82f6'
                            }}
                          >
                            {participant.name?.charAt(0) || 'D'}
                          </Avatar>
                        ))}
                        {meeting.participants.length > 4 && (
                          <Avatar 
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              fontSize: '0.75rem',
                              bgcolor: '#64748b'
                            }}
                          >
                            +{meeting.participants.length - 4}
                          </Avatar>
                        )}
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/meetings/${meeting.id}`)}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Bekijk
                    </Button>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {meeting.status === 'scheduled' && (
                        <Button
                          variant="contained"
                          startIcon={<PlayIcon />}
                          onClick={() => navigate(`/meetings/${meeting.id}/room`)}
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            '&:hover': { backgroundColor: '#059669' },
                            borderRadius: 2
                          }}
                        >
                          Start
                        </Button>
                      )}
                      {meeting.status === 'active' && (
                        <Button
                          variant="contained"
                          startIcon={<VideoCallIcon />}
                          onClick={() => navigate(`/meetings/${meeting.id}/room`)}
                          size="small"
                          sx={{
                            backgroundColor: '#3b82f6',
                            '&:hover': { backgroundColor: '#2563eb' },
                            borderRadius: 2
                          }}
                        >
                          Deelnemen
                        </Button>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ color: '#3b82f6', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Gesprekken laden...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1e293b',
            mb: 1
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overzicht van al je gesprekken en hun voortgang
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VideoCallIcon sx={{ color: '#0284c7', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#0284c7', fontWeight: 600 }}>
                    {openMeetings.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Actieve Gesprekken
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #dcfce7' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ color: '#16a34a', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#16a34a', fontWeight: 600 }}>
                    {meetings.reduce((total, meeting) => total + (meeting.participants?.length || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Totaal Deelnemers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fefce8', border: '1px solid #fef3c7' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ color: '#ca8a04', mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" sx={{ color: '#ca8a04', fontWeight: 600 }}>
                    {closedMeetings.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Voltooide Gesprekken
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Open Meetings Section */}
      {renderMeetingSection(
        openMeetings, 
        "Actieve Gesprekken", 
        "Geen actieve gesprekken",
        "🌟",
        true // Show create button for empty open meetings
      )}

      {/* Closed Meetings Section */}
      {renderMeetingSection(
        closedMeetings, 
        "Voltooide Gesprekken", 
        "Geen voltooide gesprekken",
        "📋",
        false // No create button for closed meetings
      )}
    </Container>
  );
};

export default Dashboard;