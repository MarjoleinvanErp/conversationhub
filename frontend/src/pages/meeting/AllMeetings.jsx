import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  CardActions,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Button, LoadingSpinner, Alert } from '../../components/ui';

const AllMeetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Haal meetings op van Laravel backend
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/meetings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setMeetings(data.data);
        } else {
          setError('Kon meetings niet laden');
        }
      } catch (err) {
        console.error('Fetch meetings error:', err);
        setError('Verbindingsfout: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', color: '#166534', label: 'Actief' };
      case 'completed': return { bg: '#dbeafe', color: '#1e40af', label: 'Voltooid' };
      case 'scheduled': return { bg: '#fef3c7', color: '#92400e', label: 'Gepland' };
      default: return { bg: '#f3f4f6', color: '#374151', label: 'Concept' };
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Nog niet gepland';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (Math.abs(diffHours) < 1) {
      return diffHours > 0 ? 'Net afgelopen' : 'Start binnenkort';
    } else if (diffHours > 0 && diffHours < 24) {
      return `${Math.floor(diffHours)} uur geleden`;
    } else if (diffHours < 0 && Math.abs(diffHours) < 24) {
      return `Over ${Math.floor(Math.abs(diffHours))} uur`;
    } else {
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleViewMeeting = (meeting) => {
    // Navigate to meeting detail/room based on status
    if (meeting.status === 'active') {
      navigate(`/meetings/${meeting.id}/room`);
    } else {
      navigate(`/meeting/${meeting.id}`);
    }
  };

  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LoadingSpinner size="lg">Gesprekken laden...</LoadingSpinner>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header met New Meeting Button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Mijn Gesprekken
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {meetings.length} gesprekken gevonden
          </Typography>
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

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Zoek in gesprekken..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Box>

      {/* Meetings Grid */}
      {filteredMeetings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
            {searchTerm ? '🔍' : '📅'}
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {searchTerm ? 'Geen resultaten gevonden' : 'Nog geen gesprekken'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {searchTerm 
              ? 'Probeer andere zoektermen' 
              : 'Maak uw eerste gesprek om te beginnen'
            }
          </Typography>
          {!searchTerm && (
            <Button 
              variant="primary" 
              onClick={() => navigate('/meetings/create')}
              startIcon={<AddIcon />}
            >
              Nieuw Gesprek Aanmaken
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredMeetings.map((meeting) => {
            const statusInfo = getStatusColor(meeting.status);
            
            return (
              <Grid item xs={12} sm={6} lg={4} key={meeting.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    
                    {/* Status Chip */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        sx={{
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>

                    {/* Title */}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
                      {meeting.title}
                    </Typography>
                    
                    {/* Description */}
                    {meeting.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4 }}>
                        {meeting.description}
                      </Typography>
                    )}

                    {/* Meeting Info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(meeting.scheduled_at)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="caption" color="text.secondary">
                          {meeting.participants?.length || 0} deelnemers
                        </Typography>
                      </Box>

                      {meeting.duration_minutes && (
                        <Typography variant="caption" color="text.secondary">
                          Duur: {meeting.duration_minutes} minuten
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleViewMeeting(meetings)}
                      startIcon={<ViewIcon />}
                    >
                      {meeting.status === 'active' ? 'Deelnemen' : 'Bekijken'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default AllMeetings;