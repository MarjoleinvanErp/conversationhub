import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  VideoCall as VideoCallIcon,
  RecordVoiceOver as TranscriptIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import meetingService from '../../services/api/meetingService.js';

const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      const result = await meetingService.getMeeting(id);
      if (result.success) {
        setMeeting(result.data);
      } else {
        setError(result.message || 'Meeting niet gevonden');
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
      setError('Fout bij het laden van het gesprek');
    } finally {
      setLoading(false);
    }
  };

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
          fontSize: '0.875rem',
        }}
        size="medium"
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStartMeeting = async () => {
    try {
      await meetingService.startMeeting(id);
      navigate(`/meetings/${id}/room`);
    } catch (error) {
      console.error('Failed to start meeting:', error);
    }
  };

  const handleStopMeeting = async () => {
    if (window.confirm('Weet je zeker dat je dit gesprek wilt stoppen?')) {
      try {
        await meetingService.stopMeeting(id);
        await loadMeeting(); // Reload to get updated status
      } catch (error) {
        console.error('Failed to stop meeting:', error);
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ color: '#3b82f6', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
              Gesprek laden...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Terug naar Dashboard
        </Button>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!meeting) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Terug naar Dashboard
        </Button>
        <Alert severity="warning">
          Gesprek niet gevonden
        </Alert>
      </Container>
    );
  }

  const typeInfo = getTypeInfo(meeting.type);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Terug naar Dashboard
      </Button>

      {/* Meeting Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  {meeting.title}
                </Typography>
                {getStatusChip(meeting.status)}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography 
                  variant="body1" 
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

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <GroupIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" color="text.secondary">
                    {meeting.participants?.length || 0} deelnemers
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AssignmentIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" color="text.secondary">
                    {meeting.agenda_items?.length || 0} agenda punten
                  </Typography>
                </Box>

                {meeting.scheduled_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleIcon sx={{ fontSize: 18, color: '#64748b' }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(meeting.scheduled_at).toLocaleString('nl-NL')}
                    </Typography>
                  </Box>
                )}

                {meeting.created_at && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aangemaakt: {new Date(meeting.created_at).toLocaleDateString('nl-NL')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {meeting.status === 'scheduled' && (
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={handleStartMeeting}
                    fullWidth
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': { backgroundColor: '#059669' },
                    }}
                  >
                    Start Gesprek
                  </Button>
                )}
                
                {meeting.status === 'active' && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<VideoCallIcon />}
                      onClick={() => navigate(`/meetings/${id}/room`)}
                      fullWidth
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' },
                      }}
                    >
                      Deelnemen
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<StopIcon />}
                      onClick={handleStopMeeting}
                      fullWidth
                      color="error"
                    >
                      Stop Gesprek
                    </Button>
                  </>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="success">
                    <DownloadIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overzicht" />
            <Tab label="Deelnemers" />
            <Tab label="Agenda" />
            <Tab label="Transcriptie" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Tab 0: Overzicht */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Gesprek Informatie
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Titel"
                      secondary={meeting.title}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Type"
                      secondary={typeInfo.label}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={meeting.status}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Beschrijving"
                      secondary={meeting.description || 'Geen beschrijving beschikbaar'}
                    />
                  </ListItem>
                  {meeting.duration && (
                    <ListItem>
                      <ListItemText
                        primary="Duur"
                        secondary={`${meeting.duration} minuten`}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Privacy & Instellingen
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Privacy Filtering"
                      secondary="Automatische filtering van gevoelige informatie"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="GDPR Compliant"
                      secondary="Voldoet aan Europese privacy wetgeving"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Lokale Opslag"
                      secondary="Data wordt veilig lokaal opgeslagen"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Deelnemers */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Deelnemers ({meeting.participants?.length || 0})
              </Typography>
              {meeting.participants && meeting.participants.length > 0 ? (
                <Grid container spacing={2}>
                  {meeting.participants.map((participant, index) => (
                    <Grid item xs={12} sm={6} md={4} key={participant.id || index}>
                      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#3b82f6' }}>
                          {participant.name?.charAt(0) || 'D'}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {participant.name || `Deelnemer ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {participant.email || participant.role || 'Deelnemer'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Nog geen deelnemers toegevoegd aan dit gesprek
                </Alert>
              )}
            </Box>
          )}

          {/* Tab 2: Agenda */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Agenda Items ({meeting.agenda_items?.length || 0})
              </Typography>
              {meeting.agenda_items && meeting.agenda_items.length > 0 ? (
                <List>
                  {meeting.agenda_items.map((item, index) => (
                    <React.Fragment key={item.id || index}>
                      <ListItem>
                        <ListItemIcon>
                          {item.completed ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <RadioButtonUncheckedIcon color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title || `Agenda punt ${index + 1}`}
                          secondary={item.description || item.notes}
                        />
                        {item.duration && (
                          <Chip 
                            label={`${item.duration} min`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </ListItem>
                      {index < meeting.agenda_items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Geen agenda items gedefinieerd voor dit gesprek
                </Alert>
              )}
            </Box>
          )}

          {/* Tab 3: Transcriptie */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Transcriptie
              </Typography>
              {meeting.status === 'completed' ? (
                <Paper sx={{ p: 3, bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <TranscriptIcon color="primary" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Transcriptie beschikbaar
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    De volledige transcriptie van dit gesprek is beschikbaar voor download.
                  </Typography>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    Download Transcriptie
                  </Button>
                </Paper>
              ) : meeting.status === 'active' ? (
                <Alert severity="info">
                  Transcriptie wordt live gegenereerd tijdens het gesprek
                </Alert>
              ) : (
                <Alert severity="warning">
                  Transcriptie wordt beschikbaar na het voltooien van het gesprek
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default MeetingDetails;