import React from 'react';
import { Users } from './Icons.jsx';

const SpeakerPanel = ({
  availableSpeakers,
  currentSpeaker,
  onSpeakerChange
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
        <Users className="w-5 h-5 mr-2 text-slate-600" />
        🎤 Actieve Spreker
      </h3>
      
      <div className="space-y-2">
        {availableSpeakers && availableSpeakers.length > 0 ? (
          availableSpeakers.slice(0, 4).map((speaker) => (
            <button
              key={speaker.id}
              onClick={() => onSpeakerChange && onSpeakerChange(speaker)}
              className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all text-sm ${
                currentSpeaker?.id === speaker.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: speaker.color || '#6B7280' }}
              >
                {speaker.displayName ? speaker.displayName.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="flex-1 text-left font-medium">
                {speaker.displayName || speaker.name || 'Onbekende Spreker'}
              </span>
              {speaker.role && (
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {speaker.role}
                </span>
              )}
              {currentSpeaker?.id === speaker.id && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </button>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Geen sprekers beschikbaar</p>
            <p className="text-xs text-gray-400">Voeg deelnemers toe aan het gesprek</p>
          </div>
        )}
      </div>

      {/* Speaker Stats */}
      {currentSpeaker && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">📊 Spreker Info</h4>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: currentSpeaker.color || '#6B7280' }}
              >
                {currentSpeaker.displayName ? currentSpeaker.displayName.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="font-medium text-blue-800">
                {currentSpeaker.displayName || currentSpeaker.name}
              </span>
            </div>
            <div className="text-xs text-blue-600">
              <p>Rol: {currentSpeaker.role || 'Deelnemer'}</p>
              <p>Status: {currentSpeaker.isActive ? 'Actief' : 'Inactief'}</p>
              {currentSpeaker.isParticipant && (
                <p>Type: Meeting deelnemer</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {availableSpeakers && availableSpeakers.length > 4 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button 
            className="w-full text-xs text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => {
              // Deze functie zou een modal kunnen openen met alle sprekers
              console.log('Show all speakers');
            }}
          >
            Toon alle {availableSpeakers.length} sprekers →
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeakerPanel;