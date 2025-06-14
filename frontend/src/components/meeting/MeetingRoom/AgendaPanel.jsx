import React, { useState } from 'react';
import { Calendar, CheckCircle, Play as Plus } from './Icons.jsx';
import { agendaService } from '../../../services/agendaService';

const AgendaPanel = ({ 
  isExpanded, 
  onToggle, 
  meeting, 
  currentAgendaIndex, 
  onToggleAgendaItem, 
  calculateAgendaProgress,
  onMeetingUpdate,
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgendaItem, setNewAgendaItem] = useState({
    title: '',
    description: '',
    estimated_duration: ''
  });

  const handleToggleAgendaItem = async (index, agendaItem) => {
    if (isUpdating || isRefreshing) return;
    
    setIsUpdating(true);
    try {
      const newCompleted = !agendaItem.completed;
      
      await agendaService.updateAgendaItemStatus(
        meeting.id, 
        agendaItem.id, 
        newCompleted ? 'completed' : 'pending',
        newCompleted
      );

      // Update local state via parent component
      if (onToggleAgendaItem) {
        onToggleAgendaItem(index);
      }

      console.log('✅ Agenda item status updated successfully');
    } catch (error) {
      console.error('❌ Failed to update agenda item:', error);
      alert('Fout bij bijwerken agenda item. Probeer opnieuw.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAgendaItem = async (e) => {
    e.preventDefault();
    if (!newAgendaItem.title.trim() || isRefreshing) return;

    setIsUpdating(true);
    try {
      const response = await agendaService.addAgendaItem(meeting.id, {
        title: newAgendaItem.title,
        description: newAgendaItem.description,
        estimated_duration: newAgendaItem.estimated_duration ? parseInt(newAgendaItem.estimated_duration) : null
      });

      // Reset form
      setNewAgendaItem({ title: '', description: '', estimated_duration: '' });
      setShowAddForm(false);

      // Notify parent to refresh meeting data
      if (onMeetingUpdate) {
        onMeetingUpdate();
      }

      console.log('✅ Agenda item added successfully:', response.data);
    } catch (error) {
      console.error('❌ Failed to add agenda item:', error);
      alert('Fout bij toevoegen agenda item. Probeer opnieuw.');
    } finally {
      setIsUpdating(false);
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
            <h3 className="font-bold text-green-900">📋 Agenda</h3>
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
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('agenda');
            }}
            disabled={isRefreshing || isUpdating}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing || isUpdating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-green-600 hover:bg-green-50 border-green-200 shadow-sm'
            }`}
            title="Vernieuw agenda gegevens"
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
        <div className="p-4 space-y-4">
          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-green-800">Agenda gegevens worden vernieuwd...</span>
              </div>
            </div>
          )}

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
                    } ${(isUpdating || isRefreshing) ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={() => handleToggleAgendaItem(index, item)}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          (item.completed || item.status === 'completed')
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        } ${(isUpdating || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isUpdating || isRefreshing}
                      >
                        {(item.completed || item.status === 'completed') && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-medium ${(item.completed || item.status === 'completed') ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.estimated_duration && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <span className="mr-1">⏱️</span>
                            ~{item.estimated_duration} min
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Agenda Item Indicator */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">📍 Huidig Agendapunt</h4>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800">
                    {meeting.agenda_items[currentAgendaIndex]?.title || 'Geen actief item'}
                  </p>
                  <p className="text-sm text-blue-600">
                    Item {currentAgendaIndex + 1} van {meeting.agenda_items.length}
                  </p>
                </div>
              </div>

              {/* Agenda Statistics */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">📊 Agenda Statistieken</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Totaal items:</span>
                    <div className="font-medium">{meeting.agenda_items.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Voltooid:</span>
                    <div className="font-medium text-green-600">
                      {meeting.agenda_items.filter(item => item.completed || item.status === 'completed').length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Resterend:</span>
                    <div className="font-medium text-orange-600">
                      {meeting.agenda_items.filter(item => !item.completed && item.status !== 'completed').length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Geschatte tijd:</span>
                    <div className="font-medium">
                      {meeting.agenda_items.reduce((total, item) => {
                        return total + (parseInt(item.estimated_duration) || 0);
                      }, 0)} min
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-8 text-gray-500 ${isRefreshing ? 'opacity-50' : ''}`}>
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Geen agenda items</p>
              <p className="text-sm">Dit gesprek heeft geen agenda gedefinieerd</p>
            </div>
          )}

          {/* Add Agenda Item Section */}
          <div className="border-t pt-4">
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

          {/* Loading Overlay for Critical Actions */}
          {(isUpdating || isRefreshing) && (
            <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-xl">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg border">
                <svg className="animate-spin w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-green-800">
                  {isRefreshing ? 'Vernieuwen...' : 'Bijwerken...'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgendaPanel;