import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { Button, Alert } from '../../../ui';

const AddParticipantModal = ({ 
  open, 
  onClose, 
  onAddParticipant, 
  isAdding = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Deelnemer'
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const roles = [
    { value: 'Moderator', label: 'Moderator', icon: '🎯' },
    { value: 'Deelnemer', label: 'Deelnemer', icon: '👤' },
    { value: 'Notulist', label: 'Notulist', icon: '📝' },
    { value: 'Observant', label: 'Observant', icon: '👀' },
    { value: 'Gast', label: 'Gast', icon: '🎭' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Naam is verplicht';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Naam moet minimaal 2 karakters bevatten';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Voer een geldig e-mailadres in';
    }

    if (!formData.role) {
      newErrors.role = 'Selecteer een rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const participantData = {
        name: formData.name.trim(),
        displayName: formData.name.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        isActive: true,
        isParticipant: true,
        status: 'online',
        joinedAt: new Date().toISOString(),
        speakingTime: 0,
        segments: 0
      };

      console.log('🔨 Adding new participant:', participantData);
      
      if (onAddParticipant) {
        await onAddParticipant(participantData);
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Error adding participant:', error);
      setErrors({ submit: 'Er is een fout opgetreden bij het toevoegen van de deelnemer' });
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', role: 'Deelnemer' });
    setErrors({});
    setShowSuccess(false);
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isAdding) {
      handleSubmit();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        bgcolor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Nieuwe Deelnemer Toevoegen
          </Typography>
        </Box>
        
        <IconButton 
          onClick={handleClose}
          size="small"
          disabled={isAdding}
          sx={{ 
            color: '#64748b',
            '&:hover': { bgcolor: '#e2e8f0' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Success Alert */}
        {showSuccess && (
          <Box sx={{ mb: 3 }}>
            <Alert variant="success">
              Deelnemer succesvol toegevoegd!
            </Alert>
          </Box>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <Box sx={{ mb: 3 }}>
            <Alert variant="error">
              {errors.submit}
            </Alert>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Name Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Naam *
            </Typography>
            <TextField
              fullWidth
              placeholder="Voer de naam van de deelnemer in"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyPress={handleKeyPress}
              error={!!errors.name}
              helperText={errors.name}
              disabled={isAdding}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ color: '#64748b', mr: 1 }} />
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>

          {/* Email Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              E-mailadres
              <Typography component="span" variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                (optioneel)
              </Typography>
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder="naam@voorbeeld.nl"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onKeyPress={handleKeyPress}
              error={!!errors.email}
              helperText={errors.email || 'Optioneel veld voor contact informatie'}
              disabled={isAdding}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>

          {/* Role Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Rol *
            </Typography>
            <TextField
              fullWidth
              select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              error={!!errors.role}
              helperText={errors.role || 'Selecteer de rol van de deelnemer in het gesprek'}
              disabled={isAdding}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Role Descriptions */}
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f1f5f9', 
            borderRadius: 2,
            border: '1px solid #e2e8f0'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'block' }}>
              Rol Uitleg:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Moderator:</strong> Leidt het gesprek en beheert de agenda
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Deelnemer:</strong> Actieve deelnemer in het gesprek
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Notulist:</strong> Verantwoordelijk voor verslaglegging
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Observant:</strong> Luistert mee zonder actieve deelname
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Gast:</strong> Tijdelijke deelnemer voor specifiek onderwerp
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          variant="neutral"
          onClick={handleClose}
          disabled={isAdding}
          fullWidth={false}
        >
          Annuleren
        </Button>
        
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isAdding}
          disabled={!formData.name.trim() || isAdding}
          fullWidth={false}
        >
          {isAdding ? 'Toevoegen...' : 'Deelnemer Toevoegen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddParticipantModal;