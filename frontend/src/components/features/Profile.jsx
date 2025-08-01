import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  IconButton,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Button } from '../../components/ui';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Profile form data - alleen de essentiële velden
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      // Split naam in voor- en achternaam
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setProfileData({
        firstName: firstName,
        lastName: lastName,
        role: user.role || ''
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!profileData.firstName.trim()) {
        setError('Voornaam is verplicht');
        setIsSaving(false);
        return;
      }
      if (!profileData.lastName.trim()) {
        setError('Achternaam is verplicht');
        setIsSaving(false);
        return;
      }
      if (!profileData.role.trim()) {
        setError('Functie is verplicht');
        setIsSaving(false);
        return;
      }

      // Simuleer API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local user data in AuthContext (simulate successful save)
      const updatedUser = {
        ...user,
        name: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
        role: profileData.role.trim()
      };
      
      // In een echte app zou je hier de user state in AuthContext updaten
      // Voor nu tonen we success en blijven de changes lokaal bestaan
      console.log('Zou opslaan:', updatedUser);
      
      setSuccess('Profiel succesvol bijgewerkt!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError('Er is een fout opgetreden bij het opslaan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    
    // Reset form data to original user data
    if (user) {
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setProfileData({
        firstName: firstName,
        lastName: lastName,
        role: user.role || ''
      });
    }
  };

  const getUserInitials = () => {
    if (profileData.firstName && profileData.lastName) {
      return (profileData.firstName[0] + profileData.lastName[0]).toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getFullName = () => {
    return `${profileData.firstName} ${profileData.lastName}`.trim() || 'Geen naam ingesteld';
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Geen gebruiker gevonden
          </Typography>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Inloggen
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Mijn Profiel
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Beheer uw basisgegevens
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="neutral"
                  onClick={handleCancel}
                  disabled={isSaving}
                  startIcon={<CancelIcon />}
                >
                  Annuleren
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaving}
                  startIcon={<SaveIcon />}
                >
                  {isSaving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
                startIcon={<EditIcon />}
              >
                Bewerken
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Profile Card */}
      <Card sx={{ borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          
          {/* Profile Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'center' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                backgroundColor: '#3b82f6',
                fontSize: '2.5rem',
                mr: 3
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {getFullName()}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {profileData.role || 'Geen functie ingesteld'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
            <PersonIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Persoonlijke Gegevens
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Voornaam"
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Achternaam"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Functie"
                value={profileData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                disabled={!isEditing}
                required
                placeholder="Bijv. Gesprekscoördinator, Manager, Secretaris"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>

          {/* Read-only Email */}
          <Box sx={{ mt: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'block' }}>
              E-mailadres (alleen-lezen)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Neem contact op met de beheerder om uw e-mailadres te wijzigen
            </Typography>
          </Box>

        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;