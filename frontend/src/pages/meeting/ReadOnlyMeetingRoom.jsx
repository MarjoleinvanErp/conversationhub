import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Paper,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  RecordVoiceOver as TranscribeIcon,
  Description as ReportIcon,
  CheckCircle as CheckIcon,
  PlayCircleOutline as PlayIcon
} from '@mui/icons-material';
import { LoadingSpinner, Badge } from '../../components/ui';

const ReadOnlyMeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMeetingData = async () => {
      try {
        setIsLoading(true);
        
        // Simuleer API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock meeting data
        const mockMeeting = {
          id: id,
          title: "Budgetbespreking Q1 2025",
          description: "Bespreking van het budget voor het eerste kwartaal",
          status: "completed",
          startTime: new Date(Date.now() - 3600000).toISOString(), // 1 uur geleden
          endTime: new Date(Date.now() - 1800000).toISOString(), // 30 min geleden
          duration: 1800, // 30 minuten
          location: "Raadzaal A",
          meetingType: "Vergadering",
          privacy: true,
          hasReport: true
        };

        const mockParticipants = [
          {
            id: 1,
            name: 'Jan van der Berg',
            displayName: 'Jan van der Berg',
            role: 'Moderator',
            isActive: false,
            speakingTime: 890,
            segments: 12,
            joinedAt: mockMeeting.startTime,
            leftAt: mockMeeting.endTime
          },
          {
            id: 2,
            name: 'Maria Pietersen',
            displayName: 'Maria Pietersen',
            role: 'Deelnemer',
            isActive: false,
            speakingTime: 645,
            segments: 8,
            joinedAt: mockMeeting.startTime,
            leftAt: mockMeeting.endTime
          },
          {
            id: 3,
            name: 'Peter de Vries',
            displayName: 'Peter de Vries',
            role: 'Deelnemer',
            isActive: false,
            speakingTime: 265,
            segments: 4,
            joinedAt: mockMeeting.startTime,
            leftAt: new Date(Date.now() - 2100000).toISOString() // Vroeger vertrokken
          }
        ];

        const mockAgenda = [
          {
            id: 1,
            title: "Opening en welkom",
            description: "Welkom aan alle deelnemers",
            completed: true,
            estimatedDuration: 5,
            order: 1
          },
          {
            id: 2,
            title: "Budget Q1 2025",
            description: "Bespreking hoofdlijnen budget eerste kwartaal",
            completed: true,
            estimatedDuration: 15,
            order: 2
          },
          {
            id: 3,
            title: "Actiepunten en vervolgstappen",
            description: "Afspraken over vervolgacties",
            completed: true,
            estimatedDuration: 10,
            order: 3
          }
        ];

        const mockTranscriptions = [
          {
            id: 1,
            speaker: "Jan van der Berg",
            text: "Goedemorgen allemaal, welkom bij de budgetbespreking voor Q1 2025. Ik zie dat iedereen aanwezig is.",
            timestamp: new Date(Date.now() - 3550000).toISOString(),
            confidence: 0.95,
            duration: 8
          },
          {
            id: 2,
            speaker: "Maria Pietersen",
            text: "Dank je Jan. Ik heb de cijfers van vorig kwartaal nog eens doorgenomen en er zijn een paar aandachtspunten.",
            timestamp: new Date(Date.now() - 3520000).toISOString(),
            confidence: 0.92,
            duration: 12
          },
          {
            id: 3,
            speaker: "Peter de Vries",
            text: "Kunnen we even stilstaan bij de IT-uitgaven? Die zijn hoger uitgevallen dan verwacht.",
            timestamp: new Date(Date.now() - 3480000).toISOString(),
            confidence: 0.88,
            duration: 9
          },
          {
            id: 4,
            speaker: "Jan van der Berg",
            text: "Goede vraag Peter. Maria, kun je daar wat meer over vertellen?",
            timestamp: new Date(Date.now() - 3450000).toISOString(),
            confidence: 0.94,
            duration: 6
          },
          {
            id: 5,
            speaker: "Maria Pietersen",
            text: "Zeker. We hebben extra investeringen gedaan in beveiliging en cloud infrastructuur. Dit was noodzakelijk voor de nieuwe systemen.",
            timestamp: new Date(Date.now() - 3420000).toISOString(),
            confidence: 0.91,
            duration: 15
          }
        ];

        setMeeting(mockMeeting);
        setParticipants(mockParticipants);
        setAgendaItems(mockAgenda);
        setTranscriptions(mockTranscriptions);

      } catch (error) {
        console.error('Failed to load meeting data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadMeetingData();
    }
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#dbeafe', color: '#1e40af', label: 'Voltooid' };
      case 'active': return { bg: '#dcfce7', color: '#166534', label: 'Actief' };
      case 'scheduled': return { bg: '#fef3c7', color: '#92400e', label: 'Gepland' };
      default: return { bg: '#f3f4f6', color: '#374151', label: 'Onbekend' };
    }
  };

  const getSpeakerColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}u ${minutes % 60}m`;
    }
    return `${minutes} min`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <LoadingSpinner size="lg">Meeting laden...</LoadingSpinner>
        </Box>
      </Container>
    );
  }

  if (!meeting) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Meeting niet gevonden
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Het opgevraagde gesprek kon niet worden geladen.
          </Typography>
        </Box>
      </Container>
    );
  }

  const statusInfo = getStatusColor(meeting.status);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/meetings')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {meeting.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {meeting.description}
            </Typography>
          </Box>
          <Chip
            label={statusInfo.label}
            sx={{
              backgroundColor: statusInfo.bg,
              color: statusInfo.color,
              fontWeight: 600
            }}
          />
        </Box>

        {/* Meeting Info */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ fontSize: 20, color: '#64748b' }} />
                <Typography variant="body2">
                  {new Date(meeting.startTime).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                Duur: {formatDuration(meeting.duration)}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="text.secondary">
                Locatie: {meeting.location}
              </Typography>
            </Grid>
            {meeting.privacy && (
              <Grid item>
                <Chip label="🔒 Privacy" size="small" variant="outlined" />
              </Grid>
            )}
            {meeting.hasReport && (
              <Grid item>
                <Chip label="📄 Rapport" size="small" variant="outlined" />
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* Main Layout */}
      <Grid container spacing={3}>
        {/* Linker Kolom - Agenda en Transcripties */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Agenda Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📅 Agenda
                  <Badge variant="info">{agendaItems.length} items</Badge>
                </Typography>
                
                <List sx={{ p: 0 }}>
                  {agendaItems.map((item, index) => (
                    <ListItem 
                      key={item.id}
                      sx={{ 
                        px: 0,
                        py: 1,
                        borderRadius: 2,
                        mb: 1,
                        border: '1px solid #e2e8f0',
                        bgcolor: item.completed ? '#f0fdf4' : '#f8fafc'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: item.completed ? '#10b981' : '#e2e8f0',
                          color: item.completed ? 'white' : '#64748b',
                          width: 32,
                          height: 32
                        }}>
                          {item.completed ? <CheckIcon fontSize="small" /> : index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ 
                            fontWeight: 500,
                            textDecoration: item.completed ? 'none' : 'none',
                            color: item.completed ? '#059669' : '#1f2937'
                          }}>
                            {item.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {item.description}
                            </Typography>
                            {item.estimatedDuration && (
                              <Typography variant="caption" color="text.secondary">
                                Geschatte tijd: {item.estimatedDuration} minuten
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>

            {/* Transcripties Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TranscribeIcon />
                  Transcripties
                  <Badge variant="info">{transcriptions.length} segmenten</Badge>
                </Typography>
                
                <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {transcriptions.map((transcription, index) => (
                    <Box key={transcription.id} sx={{ mb: 2 }}>
                      <Card sx={{ 
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        '&:hover': { bgcolor: '#f1f5f9' }
                      }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: getSpeakerColor(index),
                                fontSize: '0.75rem',
                                mr: 1
                              }}
                            >
                              {transcription.speaker.charAt(0)}
                            </Avatar>
                            <Typography variant="caption" sx={{ fontWeight: 600, mr: 1 }}>
                              {transcription.speaker}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(transcription.timestamp)} • {transcription.confidence * 100}% betrouwbaarheid
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {transcription.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>

          </Box>
        </Grid>

        {/* Rechter Kolom - Deelnemers en Statistieken */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Deelnemers Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  👥 Deelnemers
                  <Badge variant="info">{participants.length}</Badge>
                </Typography>
                
                <List sx={{ p: 0 }}>
                  {participants.map((participant, index) => (
                    <ListItem key={participant.id} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: getSpeakerColor(index),
                            fontSize: '0.875rem'
                          }}
                        >
                          {participant.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {participant.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {participant.role}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Spreektijd: {formatDuration(participant.speakingTime)} • {participant.segments} segmenten
                            </Typography>
                          </Box>
                        }
                      />
                      <MicOffIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>

            {/* Statistieken Panel */}
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📊 Meeting Statistieken
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Totale duur:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDuration(meeting.duration)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Deelnemers:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {participants.length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Transcripties:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {transcriptions.length} segmenten
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Agenda items:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {agendaItems.filter(item => item.completed).length} / {agendaItems.length} voltooid
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Chip
                      label={statusInfo.label}
                      size="small"
                      sx={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Geen Opname Info */}
            <Paper elevation={1} sx={{ borderRadius: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <PlayIcon sx={{ fontSize: 48, color: '#0ea5e9', mb: 1 }} />
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500, mb: 1 }}>
                  Alleen-lezen weergave
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dit is een voltooide meeting. Je kunt de inhoud bekijken maar niet wijzigen.
                </Typography>
              </Box>
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReadOnlyMeetingRoom;