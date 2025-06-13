import React from 'react';
import { Calendar, CheckCircle, ChevronUp, ChevronDown } from './Icons.jsx';

const AgendaPanel = ({
  isExpanded,
  onToggle,
  meeting,
  currentAgendaIndex,
  onToggleAgendaItem,
  calculateAgendaProgress
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 cursor-pointer hover:from-green-100 hover:to-green-150 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-slate-900">📋 Agenda</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {calculateAgendaProgress()}% voltooid
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {meeting?.agenda_items && meeting.agenda_items.length > 0 ? (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Voortgang</span>
                  <span>{calculateAgendaProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateAgendaProgress()}%` }}
                  ></div>
                </div>
              </div>

              {/* Agenda Items */}
              <div className="space-y-3">
                {meeting.agenda_items.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => onToggleAgendaItem(index)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      item.completed
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          item.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {item.completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.estimated_duration && (
                          <p className="text-xs text-gray-500 mt-1">
                            ⏱️ ~{item.estimated_duration} min
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Agenda Item */}
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

              {/* Agenda Navigation */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">🎯 Agenda Navigatie</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentAgendaIndex > 0) {
                        // Deze functie zou in de parent component geïmplementeerd moeten worden
                        console.log('Navigate to previous agenda item');
                      }
                    }}
                    disabled={currentAgendaIndex === 0}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentAgendaIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    ← Vorige
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentAgendaIndex < meeting.agenda_items.length - 1) {
                        // Deze functie zou in de parent component geïmplementeerd moeten worden
                        console.log('Navigate to next agenda item');
                      }
                    }}
                    disabled={currentAgendaIndex === meeting.agenda_items.length - 1}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentAgendaIndex === meeting.agenda_items.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Volgende →
                  </button>
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
                      {meeting.agenda_items.filter(item => item.completed).length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Resterend:</span>
                    <div className="font-medium text-orange-600">
                      {meeting.agenda_items.filter(item => !item.completed).length}
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
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Geen agenda items</p>
              <p className="text-sm">Dit gesprek heeft geen agenda gedefinieerd</p>
              
              {/* Quick Add Agenda Item (Optional) */}
              <div className="mt-4">
                <button 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Deze functie zou in de parent component geïmplementeerd moeten worden
                    alert('Agenda item toevoegen functionaliteit wordt nog geïmplementeerd');
                  }}
                >
                  + Voeg agenda item toe
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgendaPanel;