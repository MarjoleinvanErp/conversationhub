import React, { useState } from 'react';
import { Calendar, CheckCircle, Play as Plus } from './Icons.jsx';
import { agendaService } from '../../../services/agendaService';

const AgendaPanel = ({ 
  isExpanded, 
  onToggle, 
  meeting, 
  setMeeting, // NEW: Direct meeting state setter
  currentAgendaIndex, 
  onToggleAgendaItem, 
  calculateAgendaProgress,
  onMeetingUpdate, // Legacy support
  onAgendaRefresh,
  isRefreshing = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [newAgendaItem, setNewAgendaItem] = useState({
    title: '',
    description: '',
    estimated_duration: ''
  });

  // Helper function for immediate local updates
  const updateMeetingLocally = (updateFunction) => {
    if (setMeeting && meeting) {
      setMeeting(prevMeeting => {
        const updatedMeeting = { ...prevMeeting };
        updateFunction(updatedMeeting);
        return updatedMeeting;
      });
    }
  };

  // Helper function to trigger refresh (only as fallback)
  const triggerRefresh = () => {
    if (onAgendaRefresh) {
      onAgendaRefresh();
    } else if (onMeetingUpdate) {
      onMeetingUpdate();
    }
  };

  // Handle deleting agenda item with custom confirm dialog
  const handleDeleteAgendaItem = (agendaItem, e) => {
    e?.stopPropagation();
    if (isUpdating || isRefreshing) return;
    
    setItemToDelete(agendaItem);
    setShowDeleteConfirm(true);
  };

  // Confirm delete action
  const confirmDeleteAgendaItem = async () => {
    if (!itemToDelete) return;
    
    const itemToDeleteCopy = { ...itemToDelete };
    const itemIndex = meeting.agenda_items.findIndex(item => item.id === itemToDelete.id);
    
    // IMMEDIATE LOCAL UPDATE - Remove from UI right away
    updateMeetingLocally((meeting) => {
      meeting.agenda_items = meeting.agenda_items.filter(item => item.id !== itemToDelete.id);
    });
    
    // Close dialog
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    
    // Background database update
    try {
      await agendaService.deleteAgendaItem(meeting.id, itemToDeleteCopy.id);
      console.log('✅ Agenda item deleted from database');
      
    } catch (error) {
      console.error('❌ Failed to delete agenda item from database:', error);
      
      // ROLLBACK: Add the item back on error
      updateMeetingLocally((meeting) => {
        if (!meeting.agenda_items) meeting.agenda_items = [];
        // Insert back at original position
        meeting.agenda_items.splice(itemIndex, 0, itemToDeleteCopy);
      });
      
      alert('Fout bij verwijderen agenda item. Het item is teruggezet.');
    }
  };

  // Handle agenda item toggle with immediate local updates
  const handleToggleAgendaItem = async (index, agendaItem) => {
    if (isUpdating || isRefreshing) return;
    
    const newCompleted = !(agendaItem.completed || agendaItem.status === 'completed');
    const newStatus = newCompleted ? 'completed' : 'pending';
    
    console.log(`🔄 Toggling agenda item ${index}: ${agendaItem.completed} -> ${newCompleted}`);
    
    // IMMEDIATE LOCAL UPDATE - Update UI right away
    updateMeetingLocally((meeting) => {
      if (meeting.agenda_items && meeting.agenda_items[index]) {
        meeting.agenda_items[index] = {
          ...meeting.agenda_items[index],
          status: newStatus,
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null
        };
      }
    });
    
    // Background database update (no UI blocking)
    try {
      await agendaService.updateAgendaItemStatus(
        meeting.id, 
        agendaItem.id, 
        newStatus,
        newCompleted
      );
      
      console.log('✅ Agenda item status updated in database');
      
    } catch (error) {
      console.error('❌ Failed to update agenda item in database:', error);
      
      // ROLLBACK: Revert the local change on database error
      updateMeetingLocally((meeting) => {
        if (meeting.agenda_items && meeting.agenda_items[index]) {
          meeting.agenda_items[index] = {
            ...meeting.agenda_items[index],
            status: agendaItem.status,
            completed: agendaItem.completed,
            completed_at: agendaItem.completed_at
          };
        }
      });
      
      alert('Fout bij bijwerken agenda item. De wijziging is teruggedraaid.');
    }
  };

  // Handle adding agenda item with immediate local updates
  const handleAddAgendaItem = async (e) => {
    e.preventDefault();
    if (!newAgendaItem.title.trim() || isRefreshing) return;

    const formData = { ...newAgendaItem };
    const tempId = `temp_${Date.now()}`;
    
    // Create new agenda item
    const newItem = {
      id: tempId,
      title: formData.title,
      description: formData.description,
      estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
      status: 'pending',
      completed: false,
      order: (meeting?.agenda_items?.length || 0) + 1,
      completed_at: null
    };
    
    // IMMEDIATE LOCAL UPDATE - Add to UI right away
    updateMeetingLocally((meeting) => {
      if (!meeting.agenda_items) meeting.agenda_items = [];
      meeting.agenda_items.push(newItem);
    });
    
    // Reset form immediately
    setNewAgendaItem({ title: '', description: '', estimated_duration: '' });
    setShowAddForm(false);
    
    // Background database update
    try {
      const response = await agendaService.addAgendaItem(meeting.id, {
        title: formData.title,
        description: formData.description,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null
      });

      console.log('✅ Agenda item added to database:', response.data);
      
      // Replace temp item with real data from server
      if (response.data && response.data.data) {
        updateMeetingLocally((meeting) => {
          const itemIndex = meeting.agenda_items.findIndex(item => item.id === tempId);
          if (itemIndex !== -1) {
            meeting.agenda_items[itemIndex] = {
              ...response.data.data,
              completed: response.data.data.status === 'completed'
            };
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to add agenda item to database:', error);
      
      // ROLLBACK: Remove the temp item on error
      updateMeetingLocally((meeting) => {
        meeting.agenda_items = meeting.agenda_items.filter(item => item.id !== tempId);
      });
      
      // Restore form
      setNewAgendaItem(formData);
      setShowAddForm(true);
      
      alert('Fout bij toevoegen agenda item. Probeer opnieuw.');
    }
  };

  // Handle manual refresh button
  const handleManualRefresh = (e) => {
    e.stopPropagation();
    if (!isRefreshing && !isUpdating) {
      triggerRefresh();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <Calendar className="w-5 h-5 text-green-600" />
          <div>
            <h4 className="font-bold text-green-900">Agenda</h4>
            <p className="text-sm text-green-700">
              {meeting?.agenda_items?.length > 0 
                ? `${meeting.agenda_items.filter(item => item.completed || item.status === 'completed').length} van ${meeting.agenda_items.length} voltooid`
                : 'Geen agenda items'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Progress Indicator */}
          {meeting?.agenda_items?.length > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-green-800">
                {calculateAgendaProgress()}% voltooid
              </div>
              <div className="w-20 bg-green-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateAgendaProgress()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isUpdating}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing || isUpdating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-green-600 hover:bg-green-50 border-green-200 shadow-sm'
            }`}
            title="Vernieuw alleen agenda gegevens"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
          
          {/* Expand/Collapse Button */}
          <button
            onClick={onToggle}
            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
          >
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 relative">
          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 bg-green-50 border border-green-200 rounded-lg p-3 mb-4 z-10">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-green-800">Agenda wordt bijgewerkt...</span>
              </div>
            </div>
          )}

          {/* Content with proper margin when refreshing */}
          <div className={`${isRefreshing ? 'mt-16' : ''} transition-all duration-200`}>
            {meeting?.agenda_items && meeting.agenda_items.length > 0 ? (
              <div className="space-y-4">
                {/* Agenda Items List */}
                <div className="space-y-3">
                  {meeting.agenda_items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        (item.completed || item.status === 'completed')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${(isUpdating || isRefreshing) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!isUpdating && !isRefreshing) {
                          handleToggleAgendaItem(index, item);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                          (item.completed || item.status === 'completed')
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 hover:border-green-400'
                        }`}>
                          {(item.completed || item.status === 'completed') && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm ${
                            (item.completed || item.status === 'completed') 
                              ? 'text-green-800 line-through' 
                              : 'text-slate-900'
                          }`}>
                            {item.title}
                          </h4>
                          
                          {item.description && (
                            <p className={`text-xs mt-1 ${
                              (item.completed || item.status === 'completed') 
                                ? 'text-green-600' 
                                : 'text-slate-500'
                            }`}>
                              {item.description}
                            </p>
                          )}
                          
                          {item.estimated_duration && (
                            <p className={`text-xs mt-1 ${
                              (item.completed || item.status === 'completed') 
                                ? 'text-green-600' 
                                : 'text-slate-400'
                            }`}>
                              ⏱️ {item.estimated_duration} min
                            </p>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteAgendaItem(item, e)}
                          disabled={isUpdating || isRefreshing}
                          className={`p-1 rounded-lg transition-colors ${
                            isUpdating || isRefreshing
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title="Verwijder agenda item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Agenda Item */}
                <div className="border-t border-gray-200 pt-4">
                  {!showAddForm ? (
                    <button 
                      className={`w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center space-x-2 ${
                        (isUpdating || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isUpdating && !isRefreshing) {
                          setShowAddForm(true);
                        }
                      }}
                      disabled={isUpdating || isRefreshing}
                    >
                      <span>➕</span>
                      <span>Voeg agenda item toe</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAddAgendaItem} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Agenda item titel"
                        value={newAgendaItem.title}
                        onChange={(e) => setNewAgendaItem(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        disabled={isUpdating || isRefreshing}
                        autoFocus
                      />
                      <textarea
                        placeholder="Beschrijving (optioneel)"
                        value={newAgendaItem.description}
                        onChange={(e) => setNewAgendaItem(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows="2"
                        disabled={isUpdating || isRefreshing}
                      />
                      <input
                        type="number"
                        placeholder="Geschatte tijd (minuten)"
                        value={newAgendaItem.estimated_duration}
                        onChange={(e) => setNewAgendaItem(prev => ({ ...prev, estimated_duration: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                        disabled={isUpdating || isRefreshing}
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isUpdating || isRefreshing || !newAgendaItem.title.trim()}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating ? 'Toevoegen...' : 'Toevoegen'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isUpdating && !isRefreshing) {
                              setShowAddForm(false);
                              setNewAgendaItem({ title: '', description: '', estimated_duration: '' });
                            }
                          }}
                          disabled={isUpdating || isRefreshing}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Annuleren
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">Nog geen agenda items toegevoegd</p>
                
                {!showAddForm ? (
                  <button 
                    className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm ${
                      (isUpdating || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isUpdating && !isRefreshing) {
                        setShowAddForm(true);
                      }
                    }}
                    disabled={isUpdating || isRefreshing}
                  >
                    ➕ Eerste agenda item toevoegen
                  </button>
                ) : (
                  <form onSubmit={handleAddAgendaItem} className="space-y-3 max-w-sm mx-auto">
                    <input
                      type="text"
                      placeholder="Agenda item titel"
                      value={newAgendaItem.title}
                      onChange={(e) => setNewAgendaItem(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={isUpdating || isRefreshing}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={isUpdating || isRefreshing || !newAgendaItem.title.trim()}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Toevoegen...' : 'Toevoegen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isUpdating && !isRefreshing) {
                            setShowAddForm(false);
                            setNewAgendaItem({ title: '', description: '', estimated_duration: '' });
                          }
                        }}
                        disabled={isUpdating || isRefreshing}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuleren
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Agenda item verwijderen
            </h3>
            <p className="text-gray-600 mb-4">
              Weet je zeker dat je "<strong>{itemToDelete?.title}</strong>" wilt verwijderen?
              Deze actie kan niet ongedaan gemaakt worden.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDeleteAgendaItem}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaPanel;