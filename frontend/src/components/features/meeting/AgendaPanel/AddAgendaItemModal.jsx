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
  Divider,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Title as TitleIcon
} from '@mui/icons-material';
import { Button, Alert } from '../../../ui';

const AddAgendaItemModal = ({ 
  open, 
  onClose, 
  onAddAgendaItem, 
  isAdding = false,
  existingItems = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimated_duration: '',
    priority: 'normal'
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const priorities = [
    { value: 'low', label: 'Laag', color: '#10b981', icon: '📝' },
    { value: 'normal', label: 'Normaal', color: '#3b82f6', icon: '📋' },
    { value: 'high', label: 'Hoog', color: '#f59e0b', icon: '⚡' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', icon: '🚨' }
  ];

  const durationPresets = [
    { value: '5', label: '5 min' },
    { value: '10', label: '10 min' },
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1 uur' }
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

    if (!formData.title.trim()) {
      newErrors.title = 'Titel is verplicht';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Titel moet minimaal 2 karakters bevatten';
    }

    // Check for duplicate titles
    if (formData.title.trim() && existingItems.some(item => 
      item.title.toLowerCase() === formData.title.trim().toLowerCase()
    )) {
      newErrors.title = 'Er bestaat al een agenda item met deze titel';
    }

    if (formData.estimated_duration && 
        (isNaN(formData.estimated_duration) || 
         parseInt(formData.estimated_duration) < 1 || 
         parseInt(formData.estimated_duration) > 480)) {
      newErrors.estimated_duration = 'Voer een geldige tijd in tussen 1 en 480 minuten';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const agendaItemData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        priority: formData.priority,
        status: 'pending',
        completed: false,
        order: existingItems.length + 1
      };

      console.log('🔨 Adding new agenda item:', agendaItemData);
      
      if (onAddAgendaItem) {
        await onAddAgendaItem(agendaItemData);
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Error adding agenda item:', error);
      setErrors({ submit: 'Er is een fout opgetreden bij het toevoegen van het agenda item' });
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', estimated_duration: '', priority: 'normal' });
    setErrors({});
    setShowSuccess(false);
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && event.ctrlKey && !isAdding) {
      handleSubmit();
    }
  };

  const handleDurationPresetClick = (duration) => {
    handleInputChange('estimated_duration', duration);
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : '#3b82f6';
  };

  const getTotalEstimatedTime = () => {
    const existingTime = existingItems.reduce((total, item) => 
      total + (item.estimated_duration || 0), 0
    );
    const newTime = formData.estimated_duration ? parseInt(formData.estimated_duration) : 0;
    return existingTime + newTime;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
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
          <AddIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Nieuw Agenda Item
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
              Agenda item succesvol toegevoegd!
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
          {/* Title Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Titel *
            </Typography>
            <TextField
              fullWidth
              placeholder="Bijv. Budget bespreking Q4"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onKeyPress={handleKeyPress}
              error={!!errors.title}
              helperText={errors.title}
              disabled={isAdding}
              InputProps={{
                startAdornment: (
                  <TitleIcon sx={{ color: '#64748b', mr: 1 }} />
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>

          {/* Description Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Beschrijving
              <Typography component="span" variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                (optioneel)
              </Typography>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Details over het agenda item, wie het presenteert, wat er besproken wordt..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isAdding}
              InputProps={{
                startAdornment: (
                  <DescriptionIcon sx={{ color: '#64748b', mr: 1, mt: 0.5, alignSelf: 'flex-start' }} />
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>

          {/* Duration and Priority Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Duration Field */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Geschatte tijd (minuten)
                <Typography component="span" variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                  (optioneel)
                </Typography>
              </Typography>
              <TextField
                fullWidth
                type="number"
                placeholder="15"
                value={formData.estimated_duration}
                onChange={(e) => handleInputChange('estimated_duration', e.target.value)}
                error={!!errors.estimated_duration}
                helperText={errors.estimated_duration}
                disabled={isAdding}
                InputProps={{
                  startAdornment: (
                    <ScheduleIcon sx={{ color: '#64748b', mr: 1 }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              
              {/* Duration Presets */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {durationPresets.map((preset) => (
                  <Chip
                    key={preset.value}
                    label={preset.label}
                    size="small"
                    onClick={() => handleDurationPresetClick(preset.value)}
                    disabled={isAdding}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#e0f2fe'
                      },
                      ...(formData.estimated_duration === preset.value && {
                        bgcolor: '#0ea5e9',
                        color: 'white'
                      })
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Priority Field */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Prioriteit
              </Typography>
              <TextField
                fullWidth
                select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                disabled={isAdding}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority.value} value={priority.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{priority.icon}</span>
                      <span>{priority.label}</span>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: priority.color,
                          ml: 'auto'
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* Meeting Summary */}
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f1f5f9', 
            borderRadius: 2,
            border: '1px solid #e2e8f0'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'block' }}>
              Meeting Overzicht:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Huidige agenda items:</strong> {existingItems.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Totale geschatte tijd:</strong> {getTotalEstimatedTime()} minuten
                {getTotalEstimatedTime() > 0 && (
                  <span> ({Math.floor(getTotalEstimatedTime() / 60)}u {getTotalEstimatedTime() % 60}m)</span>
                )}
              </Typography>
              {formData.estimated_duration && (
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                  <strong>Na toevoegen:</strong> {getTotalEstimatedTime()} minuten totaal
                </Typography>
              )}
            </Box>
          </Box>

          {/* Tips */}
          <Box sx={{ 
            p: 2, 
            bgcolor: '#fffbeb', 
            borderRadius: 2,
            border: '1px solid #fbbf24'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#92400e', mb: 1, display: 'block' }}>
              💡 Tips voor effectieve agenda items:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="#92400e">
                • Gebruik actieve, duidelijke titels (bijv. "Besluit budget Q4" ipv "Budget")
              </Typography>
              <Typography variant="caption" color="#92400e">
                • Schat realistische tijden in en hou 5-10 min buffer aan
              </Typography>
              <Typography variant="caption" color="#92400e">
                • Prioriteer items: urgent/hoog eerst, low/normaal later
              </Typography>
              <Typography variant="caption" color="#92400e">
                • Ctrl+Enter om snel toe te voegen
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
          disabled={!formData.title.trim() || isAdding}
          fullWidth={false}
        >
          {isAdding ? 'Toevoegen...' : 'Item Toevoegen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAgendaItemModal;