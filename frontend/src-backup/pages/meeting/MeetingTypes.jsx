import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';

const MeetingTypes = () => {
  const [loading, setLoading] = useState(true);
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [error, setError] = useState('');

  // Form data for creating/editing meeting types
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    privacy_level: 'standard',
    auto_transcription: true,
    privacy_filters: []
  });

  // Privacy filter options
  const privacyFilterOptions = [
    { id: 'personal_info', label: 'Persoonlijke informatie', type: 'regex' },
    { id: 'financial_info', label: 'Financiële gegevens', type: 'keyword' },
    { id: 'medical_info', label: 'Medische informatie', type: 'ml' },
    { id: 'contact_details', label: 'Contactgegevens', type: 'regex' }
  ];

  // Load meeting types on component mount
  useEffect(() => {
    loadMeetingTypes();
  }, []);

  const loadMeetingTypes = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData = [
        {
          id: 1,
          name: 'Algemeen Gesprek',
          description: 'Standaard gesprek voor algemene onderwerpen',
          category: 'general',
          privacy_level: 'standard',
          auto_transcription: true,
          privacy_filters: ['personal_info'],
          created_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'Participatie Sessie',
          description: 'Gesprek met burgers voor participatie processen',
          category: 'participation',
          privacy_level: 'high',
          auto_transcription: true,
          privacy_filters: ['personal_info', 'contact_details'],
          created_at: '2024-01-10'
        }
      ];
      
      setTimeout(() => {
        setMeetingTypes(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Er ging iets mis bij het laden van de meeting types');
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      category: 'general',
      privacy_level: 'standard',
      auto_transcription: true,
      privacy_filters: []
    });
    setOpen(true);
  };

  const handleEdit = (meetingType) => {
    setEditingType(meetingType);
    setFormData({
      name: meetingType.name,
      description: meetingType.description,
      category: meetingType.category,
      privacy_level: meetingType.privacy_level,
      auto_transcription: meetingType.auto_transcription,
      privacy_filters: meetingType.privacy_filters
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingType(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Naam is verplicht');
        return;
      }

      // Mock API call - replace with actual implementation
      console.log('Saving meeting type:', formData);
      
      // Close dialog and reload data
      handleClose();
      loadMeetingTypes();
    } catch (error) {
      setError('Er ging iets mis bij het opslaan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Weet je zeker dat je dit meeting type wilt verwijderen?')) {
      try {
        // Mock API call - replace with actual implementation
        console.log('Deleting meeting type:', id);
        loadMeetingTypes();
      } catch (error) {
        setError('Er ging iets mis bij het verwijderen');
      }
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      general: 'Algemeen',
      participation: 'Participatie',
      care: 'Zorg',
      education: 'Onderwijs'
    };
    return categories[category] || category;
  };

  const getPrivacyLevelColor = (level) => {
    const colors = {
      low: 'success',
      standard: 'info',
      high: 'warning',
      strict: 'error'
    };
    return colors[level] || 'default';
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meeting Types Configuratie
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Beheer verschillende types gesprekken met specifieke privacy-instellingen
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{ mr: 2 }}
        >
          Nieuw Meeting Type
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Meeting Types Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Naam</TableCell>
                  <TableCell>Categorie</TableCell>
                  <TableCell>Privacy Level</TableCell>
                  <TableCell>Auto Transcriptie</TableCell>
                  <TableCell>Privacy Filters</TableCell>
                  <TableCell align="right">Acties</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  [...Array(3)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                    </TableRow>
                  ))
                ) : meetingTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nog geen meeting types geconfigureerd
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  meetingTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{type.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getCategoryLabel(type.category)} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={type.privacy_level} 
                          size="small" 
                          color={getPrivacyLevelColor(type.privacy_level)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={type.auto_transcription ? 'Aan' : 'Uit'} 
                          size="small" 
                          color={type.auto_transcription ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {type.privacy_filters.map((filter) => (
                            <Chip 
                              key={filter} 
                              label={privacyFilterOptions.find(f => f.id === filter)?.label || filter}
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(type)}
                          title="Bewerken"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(type.id)}
                          title="Verwijderen"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingType ? 'Meeting Type Bewerken' : 'Nieuw Meeting Type'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Naam"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Beschrijving"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Categorie</InputLabel>
                  <Select
                    value={formData.category}
                    label="Categorie"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="general">Algemeen</MenuItem>
                    <MenuItem value="participation">Participatie</MenuItem>
                    <MenuItem value="care">Zorg</MenuItem>
                    <MenuItem value="education">Onderwijs</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Privacy Level</InputLabel>
                  <Select
                    value={formData.privacy_level}
                    label="Privacy Level"
                    onChange={(e) => setFormData({ ...formData, privacy_level: e.target.value })}
                  >
                    <MenuItem value="low">Laag</MenuItem>
                    <MenuItem value="standard">Standaard</MenuItem>
                    <MenuItem value="high">Hoog</MenuItem>
                    <MenuItem value="strict">Strikt</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Privacy Filters</InputLabel>
                  <Select
                    multiple
                    value={formData.privacy_filters}
                    label="Privacy Filters"
                    onChange={(e) => setFormData({ ...formData, privacy_filters: e.target.value })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={privacyFilterOptions.find(f => f.id === value)?.label || value}
                            size="small" 
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {privacyFilterOptions.map((filter) => (
                      <MenuItem key={filter.id} value={filter.id}>
                        {filter.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuleren</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingType ? 'Bijwerken' : 'Aanmaken'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingTypes;