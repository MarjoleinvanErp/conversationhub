import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Security as SecurityIcon,
  VideoCall as VideoCallIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { Button, Alert, LoadingSpinner } from '../../components/ui';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingType: 'Vergadering',
    location: '',
    scheduledFor: '',
    estimatedDuration: 60,
    privacy: {
      enabled: true,
      filterKeywords: true,
      allowRecording: true,
      allowTranscription: true
    }
  });

  // Single agenda text field
  const [agendaText, setAgendaText] = useState('');

  // Participants without pre-filled data
  const [participants, setParticipants] = useState([
    { id: 1, name: '', email: '', role: 'Deelnemer' }
  ]);

  const meetingTypes = [
    { value: 'Vergadering', label: 'Vergadering', icon: '👥' },
    { value: 'Stand-up', label: 'Stand-up', icon: '⚡' },
    { value: 'Workshop', label: 'Workshop', icon: '🛠️' },
    { value: 'Brainstorm', label: 'Brainstorm', icon: '💡' },
    { value: 'Evaluatie', label: 'Evaluatie', icon: '📊' },
    { value: 'Training', label: 'Training', icon: '🎓' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handlePrivacyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value }
    }));
  };

  // Set current datetime
  const setToNow = () => {
    const now = new Date();
    // Format to match datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const datetimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    handleInputChange('scheduledFor', datetimeString);
  };

  // Parse agenda text into items for display
  const getAgendaItems = () => {
    if (!agendaText.trim()) return [];
    
    return agendaText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .map((title, index) => ({
        id: index + 1,
        title: title,
        order: index + 1
      }));
  };

  const addParticipant = () => {
    const newParticipant = {
      id: Date.now(),
      name: '',
      email: '',
      role: 'Deelnemer'
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const updateParticipant = (id, field, value) => {
    setParticipants(prev =>
      prev.map(participant =>
        participant.id === id ? { ...participant, [field]: value } : participant
      )
    );
  };

  const removeParticipant = (id) => {
    if (participants.length > 1) {
      setParticipants(prev => prev.filter(participant => participant.id !== id));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Meeting titel is verplicht');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Beschrijving is verplicht');
      return false;
    }
    if (participants.some(p => !p.name.trim() || !p.email.trim())) {
      setError('Alle deelnemers moeten een naam en e-mailadres hebben');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    setError(null);

    try {
      // Parse agenda items from text
      const agendaItems = getAgendaItems();
      
      // Simuleer API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful creation
      const meetingId = Math.floor(Math.random() * 1000) + 100;
      
      setSuccess(`Meeting "${formData.title}" is succesvol aangemaakt!`);
      
      // Redirect na 2 seconden
      setTimeout(() => {
        navigate(`/meeting/${meetingId}`);
      }, 2000);

    } catch (err) {
      setError('Er is een fout opgetreden bij het aanmaken van de meeting: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const getSpeakerColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/meetings')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Nieuw Gesprek Aanmaken
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Stel een nieuwe meeting in met agenda, deelnemers en privacy instellingen
            </Typography>
          </Box>
          <VideoCallIcon sx={{ fontSize: 48, color: '#10b981' }} />
        </Box>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {success && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="success">
            {success}
          </Alert>
        </Box>
      )}

      <Grid container spacing={4}>
        {/* Linker Kolom - Basis Informatie */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Basis Informatie */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionIcon color="primary" />
                  Basis Informatie
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Meeting Titel"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Bijv. Budgetbespreking Q1 2025"
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Beschrijving"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Korte beschrijving van het doel en de inhoud van de meeting"
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    select
                    label="Meeting Type"
                    value={formData.meetingType}
                    onChange={(e) => handleInputChange('meetingType', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  >
                    {meetingTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Locatie"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Optioneel"
                        InputProps={{
                          startAdornment: <LocationIcon sx={{ color: '#64748b', mr: 1 }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          fullWidth
                          type="datetime-local"
                          label="Gepland voor"
                          value={formData.scheduledFor}
                          onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <IconButton
                          onClick={setToNow}
                          sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: '#f1f5f9',
                            '&:hover': { bgcolor: '#e2e8f0' }
                          }}
                          size="small"
                          title="Zet op nu"
                        >
                          <AccessTimeIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    type="number"
                    label="Geschatte duur (minuten)"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
                    inputProps={{ min: 5, max: 480 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Privacy Instellingen */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon color="primary" />
                  Privacy & Opname Instellingen
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.privacy.enabled}
                        onChange={(e) => handlePrivacyChange('enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Privacy filtering inschakelen"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.privacy.filterKeywords}
                        onChange={(e) => handlePrivacyChange('filterKeywords', e.target.checked)}
                        disabled={!formData.privacy.enabled}
                        color="primary"
                      />
                    }
                    label="Automatisch gevoelige woorden filteren"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.privacy.allowRecording}
                        onChange={(e) => handlePrivacyChange('allowRecording', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Audio opname toestaan"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.privacy.allowTranscription}
                        onChange={(e) => handlePrivacyChange('allowTranscription', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Live transcriptie inschakelen"
                  />
                </Box>

                {formData.privacy.enabled && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: '#fef3c7', border: '1px solid #fbbf24' }}>
                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 500 }}>
                      🔒 Privacy filtering is ingeschakeld. Gevoelige informatie wordt automatisch 
                      gefilterd volgens AVG/GDPR richtlijnen.
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>

          </Box>
        </Grid>

        {/* Rechter Kolom - Agenda en Deelnemers */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Agenda */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📅 Agenda
                  <Chip label={`${getAgendaItems().length} items`} size="small" />
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Agenda Items"
                  value={agendaText}
                  onChange={(e) => setAgendaText(e.target.value)}
                  placeholder="Typ elk agendapunt op een nieuwe regel:&#10;&#10;Opening en mededelingen&#10;Vaststelling vorige notulen&#10;Budgetbespreking Q1&#10;Nieuwe projectvoorstellen&#10;Actiepunten en afsluiting"
                  helperText="Elk agendapunt op een nieuwe regel. Lege regels worden genegeerd."
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem' }
                  }}
                />

                {/* Preview van agenda items */}
                {getAgendaItems().length > 0 && (
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'block' }}>
                      Preview:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {getAgendaItems().map((item, index) => (
                        <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ 
                            bgcolor: '#3b82f6', 
                            color: 'white', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            fontWeight: 600,
                            minWidth: 20,
                            textAlign: 'center'
                          }}>
                            {index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            {item.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* Deelnemers */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    👥 Deelnemers
                    <Chip label={`${participants.length} personen`} size="small" />
                  </Typography>
                  <Button variant="neutral" size="sm" onClick={addParticipant}>
                    <AddIcon sx={{ mr: 1 }} />
                    Deelnemer Toevoegen
                  </Button>
                </Box>

                <List sx={{ p: 0 }}>
                  {participants.map((participant, index) => (
                    <ListItem key={participant.id} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: getSpeakerColor(index),
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem'
                        }}>
                          {participant.name.charAt(0) || <PersonIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <TextField
                              size="small"
                              label="Naam"
                              value={participant.name}
                              onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                              placeholder="Voornaam Achternaam"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                              size="small"
                              label="E-mail"
                              type="email"
                              value={participant.email}
                              onChange={(e) => updateParticipant(participant.id, 'email', e.target.value)}
                              placeholder="Optioneel"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                              size="small"
                              select
                              label="Rol"
                              value={participant.role}
                              onChange={(e) => updateParticipant(participant.id, 'role', e.target.value)}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                              <MenuItem value="Moderator">Moderator</MenuItem>
                              <MenuItem value="Deelnemer">Deelnemer</MenuItem>
                              <MenuItem value="Notulist">Notulist</MenuItem>
                              <MenuItem value="Observant">Observant</MenuItem>
                            </TextField>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {participants.length > 1 && (
                          <IconButton 
                            onClick={() => removeParticipant(participant.id)}
                            sx={{ color: '#ef4444' }}
                          >
                            <RemoveIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

          </Box>
        </Grid>
      </Grid>

      {/* Submit Section */}
      <Box sx={{ mt: 4, p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Klaar om te starten?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Controleer alle instellingen en maak de meeting aan. Deelnemers kunnen direct beginnen met deelnemen.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
              <Button
                variant="neutral"
                onClick={() => navigate('/meetings')}
                disabled={isCreating}
                sx={{ flex: { xs: 1, md: 'none' } }}
              >
                Annuleren
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isCreating}
                disabled={isCreating}
                sx={{ flex: { xs: 1, md: 'none' } }}
                startIcon={<VideoCallIcon />}
              >
                {isCreating ? 'Meeting Aanmaken...' : 'Meeting Aanmaken'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CreateMeeting;