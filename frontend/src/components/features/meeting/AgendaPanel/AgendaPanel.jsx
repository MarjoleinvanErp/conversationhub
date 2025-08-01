import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox, 
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  CheckCircle as CheckIcon,
  Schedule as TimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Card, Button, Input, Badge, Alert, LoadingSpinner } from '../../../ui';
import { agendaService } from '../../../../services/agendaService';
import AddAgendaItemModal from './AddAgendaItemModal';

const AgendaPanel = () => {
  const { id: meetingId } = useParams();
  const [agendaItems, setAgendaItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);  // NEW: Modal state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);  // NEW: Adding state
  // REMOVED: showAddForm and newItem states - not needed anymore

  // Load agenda items on mount
  useEffect(() => {
    loadAgendaItems();
  }, [meetingId]);

  const loadAgendaItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading agenda items for meeting:', meetingId);
      
      // Use actual API call
      const response = await agendaService.getAgendaItems(meetingId);
      
      if (response.success) {
        const items = response.data || [];
        // Ensure items have the right structure
        const processedItems = items.map(item => ({
          ...item,
          completed: item.completed || item.status === 'completed'
        }));
        
        setAgendaItems(processedItems);
        console.log('✅ Loaded', processedItems.length, 'agenda items');
      } else {
        throw new Error(response.message || 'Failed to load agenda items');
      }

    } catch (err) {
      console.error('❌ Failed to load agenda items:', err);
      setError('Kon agenda items niet laden: ' + err.message);
      
      // Fallback to empty array
      setAgendaItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAgendaItem = async (item) => {
    try {
      setIsUpdating(true);
      const newCompleted = !item.completed;
      const newStatus = newCompleted ? 'completed' : 'pending';

      console.log(`🔄 Toggling agenda item: ${item.title} -> ${newCompleted}`);

      // Immediate UI update
      setAgendaItems(prevItems =>
        prevItems.map(agendaItem =>
          agendaItem.id === item.id
            ? {
                ...agendaItem,
                completed: newCompleted,
                status: newStatus,
                completed_at: newCompleted ? new Date().toISOString() : null
              }
            : agendaItem
        )
      );

      // Background API call to update in database
      await agendaService.updateAgendaItemStatus(
        meetingId, 
        item.id, 
        newStatus,
        newCompleted
      );
      
      console.log('✅ Agenda item toggled successfully');

    } catch (err) {
      console.error('❌ Failed to toggle agenda item:', err);
      
      // Rollback on error
      setAgendaItems(prevItems =>
        prevItems.map(agendaItem =>
          agendaItem.id === item.id
            ? item // Revert to original state
            : agendaItem
        )
      );
      
      setError('Kon agenda item niet bijwerken: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // NEW: Updated addAgendaItem to work with modal
  const handleAddAgendaItem = async (agendaItemData) => {
    try {
      setIsAddingItem(true);
      const tempId = `temp_${Date.now()}`;
      
      const newAgendaItem = {
        id: tempId,
        title: agendaItemData.title,
        description: agendaItemData.description,
        estimated_duration: agendaItemData.estimated_duration,
        status: 'pending',
        completed: false,
        order: agendaItems.length + 1,
        completed_at: null
      };

      // Immediate UI update
      setAgendaItems(prevItems => [...prevItems, newAgendaItem]);
      
      console.log('🔨 Adding agenda item via modal:', agendaItemData);

      // Background API call to save to database
      const response = await agendaService.addAgendaItem(meetingId, {
        title: agendaItemData.title,
        description: agendaItemData.description,
        estimated_duration: agendaItemData.estimated_duration
      });

      if (response.success && response.data) {
        // Replace temp item with real ID from server
        setAgendaItems(prevItems => 
          prevItems.map(item => 
            item.id === tempId 
              ? { 
                  ...response.data.data || response.data,
                  completed: (response.data.data || response.data).status === 'completed'
                }
              : item
          )
        );
        console.log('✅ Agenda item added successfully:', response.data);
      } else {
        throw new Error(response.message || 'Failed to add agenda item');
      }

    } catch (err) {
      console.error('❌ Failed to add agenda item:', err);
      
      // Rollback on error
      setAgendaItems(prevItems => prevItems.filter(item => !item.id.toString().startsWith('temp_')));
      
      throw err; // Re-throw so modal can handle the error
    } finally {
      setIsAddingItem(false);
    }
  };

  const deleteAgendaItem = async (item) => {
    try {
      setIsUpdating(true);
      const originalItems = [...agendaItems];
      
      // Immediate UI update
      setAgendaItems(prevItems => prevItems.filter(agendaItem => agendaItem.id !== item.id));
      
      // Close dialog
      setShowDeleteDialog(false);
      setItemToDelete(null);

      // Background API call to delete from database
      await agendaService.deleteAgendaItem(meetingId, item.id);
      
      console.log('✅ Agenda item deleted successfully');

    } catch (err) {
      console.error('❌ Failed to delete agenda item:', err);
      
      // Rollback on error
      setAgendaItems(originalItems);
      
      setError('Kon agenda item niet verwijderen: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateProgress = () => {
    if (agendaItems.length === 0) return 0;
    const completed = agendaItems.filter(item => item.completed).length;
    return Math.round((completed / agendaItems.length) * 100);
  };

  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return (
      <Card variant="default" padding="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <LoadingSpinner size="md">Agenda laden...</LoadingSpinner>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md">
      {/* Header - UNCHANGED */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📅 Agenda
            {agendaItems.length > 0 && (
              <Badge variant="info">{agendaItems.length} items</Badge>
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {agendaItems.length > 0 && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  {calculateProgress()}% voltooid
                </Typography>
                <Box sx={{ 
                  width: 60, 
                  height: 4, 
                  bgcolor: '#e2e8f0', 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  mt: 0.5
                }}>
                  <Box sx={{
                    width: `${calculateProgress()}%`,
                    height: '100%',
                    bgcolor: '#10b981',
                    transition: 'width 0.3s ease'
                  }} />
                </Box>
              </Box>
            )}
            
            <Button 
              variant="neutral" 
              size="sm"
              onClick={loadAgendaItems}
              loading={isLoading}
            >
              <RefreshIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Vernieuw
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Display - UNCHANGED */}
      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Agenda Items List - UNCHANGED */}
      <Box sx={{ mb: 3 }}>
        {agendaItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h1" sx={{ fontSize: '3rem', mb: 2 }}>
              📋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Nog geen agenda items toegevoegd
            </Typography>
            {/* CHANGED: Use modal instead of inline form */}
            <Button 
              variant="primary" 
              onClick={() => setShowAddModal(true)}
              disabled={isUpdating}
            >
              <AddIcon sx={{ mr: 1 }} />
              Eerste Item Toevoegen
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {agendaItems.map((item) => (
              <ListItem 
                key={item.id}
                sx={{ 
                  px: 0, 
                  py: 1,
                  borderRadius: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: item.completed ? '#10b981' : '#e2e8f0',
                  bgcolor: item.completed ? '#f0fdf4' : 'white',
                  '&:hover': { 
                    bgcolor: item.completed ? '#f0fdf4' : '#f8fafc' 
                  },
                  transition: 'all 0.2s ease',
                  ...(isUpdating && { opacity: 0.6 })
                }}
              >
                <Checkbox 
                  checked={item.completed}
                  onChange={() => toggleAgendaItem(item)}
                  disabled={isUpdating}
                  sx={{ 
                    color: '#10b981',
                    '&.Mui-checked': { color: '#10b981' }
                  }}
                />
                
                <ListItemText 
                  primary={
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500,
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? '#059669' : '#1f2937'
                      }}
                    >
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      {item.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            textDecoration: item.completed ? 'line-through' : 'none',
                            mb: 0.5
                          }}
                        >
                          {item.description}
                        </Typography>
                      )}
                      {item.estimated_duration && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                          <Typography variant="caption" color="text.secondary">
                            {item.estimated_duration} minuten
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />

                <IconButton 
                  onClick={(e) => handleDeleteClick(item, e)}
                  disabled={isUpdating}
                  sx={{ 
                    color: '#6b7280',
                    '&:hover': { 
                      color: '#dc2626',
                      bgcolor: '#fef2f2'
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Add New Item Section - CHANGED: Use modal instead of inline form */}
      {agendaItems.length > 0 && (
        <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 3 }}>
          <Button 
            variant="primary" 
            fullWidth
            onClick={() => setShowAddModal(true)}
            disabled={isUpdating}
          >
            <AddIcon sx={{ mr: 1 }} />
            Agenda Item Toevoegen
          </Button>
        </Box>
      )}

      {/* NEW: Add Agenda Item Modal */}
      <AddAgendaItemModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddAgendaItem={handleAddAgendaItem}
        isAdding={isAddingItem}
        existingItems={agendaItems}
      />

      {/* Delete Confirmation Dialog - UNCHANGED */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => !isUpdating && setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Agenda Item Verwijderen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Weet je zeker dat je "<strong>{itemToDelete?.title}</strong>" wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Deze actie kan niet ongedaan gemaakt worden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="neutral" 
            onClick={() => setShowDeleteDialog(false)}
            disabled={isUpdating}
          >
            Annuleren
          </Button>
          <Button 
            variant="danger" 
            onClick={() => deleteAgendaItem(itemToDelete)}
            loading={isUpdating}
          >
            Verwijderen
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AgendaPanel;