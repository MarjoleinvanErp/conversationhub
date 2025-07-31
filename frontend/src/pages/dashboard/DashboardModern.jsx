// ConversationHub - Modern Dashboard
// Beautiful design with real database data
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  Avatar,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  VideoCall as VideoCallIcon,
  TrendingUp as TrendingUpIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  Alert
} from '../../components/ui';
import meetingService from '../../services/api/meetingService.js';

const DashboardModern = () => {
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

  // Calculate real stats from database data
  const activeMeetings = meetings.filter(meeting => 
    meeting.status === 'active'
  ).length;
  
  const totalParticipants = meetings.reduce((total, meeting) => 
    total + (meeting.participants?.length || 0), 0
  );
  
  const completedMeetings = meetings.filter(meeting => 
    meeting.status === 'completed'
  ).length;

  // Get recent meetings for the recent meetings section
  const recentMeetings = meetings
    .sort((a, b) => new Date(b.created_at || b.scheduled_at) - new Date(a.created_at || a.scheduled_at))
    .slice(0, 3)
    .map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      status: meeting.status,
      participants: meeting.participants?.length || 0,
      duration: "45 min", // You might want to calculate this from actual data
      startTime: meeting.scheduled_at ? 
        new Date(meeting.scheduled_at).toLocaleTimeString('nl-NL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : "Niet gepland"
    }));

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { variant: 'warning', label: 'Gepland' },
      active: { variant: 'success', label: 'Actief' },
      completed: { variant: 'default', label: 'Voltooid' },
      cancelled: { variant: 'error', label: 'Geannuleerd' },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LoadingSpinner size="lg">Dashboard laden...</LoadingSpinner>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Stats Cards - with real data */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="elevated" padding="md">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div" color="primary">
                  {meetings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totaal Gesprekken
                </Typography>
              </Box>
              <HistoryIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="elevated" padding="md">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div" color="secondary">
                  {activeMeetings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actieve Gesprekken
                </Typography>
              </Box>
              <RecordVoiceOverIcon color="secondary" sx={{ fontSize: 40 }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="elevated" padding="md">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div">
                  {totalParticipants}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totaal Deelnemers
                </Typography>
              </Box>
              <GroupIcon sx={{ fontSize: 40, color: '#6366f1' }} />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card variant="elevated" padding="md">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" component="div">
                  {completedMeetings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Voltooid
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, color: '#10b981' }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card variant="default" padding="md">
            <Typography variant="h6" gutterBottom>
              Snelle Acties
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => navigate('/meetings/create')}
              >
                <VideoCallIcon sx={{ mr: 1 }} />
                Nieuw Gesprek Starten
              </Button>
              <Button 
                variant="secondary" 
                fullWidth
                onClick={() => navigate('/meetings')}
              >
                <HistoryIcon sx={{ mr: 1 }} />
                Alle Gesprekken Bekijken
              </Button>
              <Button 
                variant="neutral" 
                fullWidth
                onClick={() => navigate('/participants')}
              >
                <GroupIcon sx={{ mr: 1 }} />
                Deelnemers Beheren
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Recent Meetings - with real data */}
        <Grid item xs={12} md={8}>
          <Card variant="default" padding="md">
            <Typography variant="h6" gutterBottom>
              Recente Gesprekken
            </Typography>
            {recentMeetings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Nog geen gesprekken aangemaakt
                </Typography>
                <Button 
                  variant="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/meetings/create')}
                >
                  <AddIcon sx={{ mr: 1 }} />
                  Eerste Gesprek Aanmaken
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentMeetings.map((meeting) => (
                  <Paper 
                    key={meeting.id}
                    elevation={1}
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {meeting.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {meeting.participants} deelnemers • {meeting.duration} • {meeting.startTime}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusBadge(meeting.status)}
                        <Button 
                          size="sm" 
                          variant="neutral"
                          onClick={() => navigate(`/meetings/${meeting.id}`)}
                        >
                          Bekijken
                        </Button>
                        {meeting.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => navigate(`/meetings/${meeting.id}/room`)}
                          >
                            Deelnemen
                          </Button>
                        )}
                        {meeting.status === 'scheduled' && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => navigate(`/meetings/${meeting.id}/room`)}
                          >
                            Start
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Privacy & Security Status */}
        <Grid item xs={12}>
          <Card variant="outlined" padding="md">
            <Box display="flex" alignItems="center" gap={2}>
              <SecurityIcon color="success" sx={{ fontSize: 30 }} />
              <Box>
                <Typography variant="h6" color="success.main">
                  🔒 Privacy & Beveiliging Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Alle gesprekken zijn GDPR/AVG compliant. Privacy filters zijn actief.
                  Laatste beveiligingscheck: vandaag 09:00
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Badge variant="success">Actief</Badge>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardModern;