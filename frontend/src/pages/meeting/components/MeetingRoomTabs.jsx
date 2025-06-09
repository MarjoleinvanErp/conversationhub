import React from 'react';
import EnhancedLiveTranscription from '../../../components/recording/EnhancedLiveTranscription.jsx';
import SimpleAudioRecorder from '../../../components/recording/AudioRecorder/SimpleAudioRecorder.jsx';
import AudioUploadRecorder from '../../../components/recording/AudioRecorder/AudioUploadRecorder.jsx';
import SpeakerDetection from '../../../components/recording/VoiceAnalytics/SpeakerDetection.jsx';
import { formatSpeakingTime, calculateAgendaProgress, formatTimestamp, getSpeakerColor } from '../utils/meetingUtils.js';


export const MeetingRoomTabs = ({
  activeTab,
  meetingId,
  meeting,
  currentSpeaker,
  availableSpeakers,
  speakerStats,
  showAudioUploader,
  setShowAudioUploader,
  currentAgendaIndex,
  agendaStartTimes,
  handlers
}) => {

  // Tab: Live Transcription
  const TranscriptionTab = () => (
    <div className="space-y-6">
      {/* Enhanced Live Transcription - Main Component */}
      <EnhancedLiveTranscription
        meetingId={meetingId}
        participants={meeting?.participants || []}
        onTranscriptionUpdate={handlers.handleTranscriptionReceived}
        onSessionStatsUpdate={handlers.handleSessionStatsUpdate}
      />

      {/* Alternative Audio Options */}
      <div className="modern-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Alternatieve Audio Opties</h3>
          <button
            onClick={() => setShowAudioUploader(!showAudioUploader)}
            className="btn-neutral px-4 py-2"
          >
            {showAudioUploader ? '🔼 Verberg' : '🔽 Toon'} Upload Opties
          </button>
        </div>

        {showAudioUploader && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simple Live Transcription */}
              <SimpleAudioRecorder
                onTranscriptionReceived={handlers.handleTranscriptionReceived}
                disabled={false}
              />

              {/* Audio Upload & Process */}
              <AudioUploadRecorder
                onTranscriptionReceived={handlers.handleTranscriptionReceived}
                meetingId={meetingId}
                disabled={false}
              />
            </div>

            {/* Voice Activity Detection */}
            <SpeakerDetection
              isRecording={false}
              audioStream={null}
              onVoiceActivity={(level) => console.log('Voice activity:', level)}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Tab: Participants Management
  const ParticipantsTab = () => (
    <div className="space-y-6">
      {/* Current Speaker Selection */}
      <div className="modern-card p-6">
        <h3 className="text-lg font-medium mb-4">🎤 Actieve Spreker</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableSpeakers.map((speaker) => (
            <div
              key={speaker.id}
              onClick={() => handlers.handleSpeakerChange(speaker)}
              className={`modern-card p-4 cursor-pointer transition-all duration-300 border-2 ${
                currentSpeaker?.id === speaker.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: speaker.color }}
                >
                  {speaker.displayName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{speaker.displayName}</h4>
                  <p className="text-sm text-gray-600 capitalize">{speaker.role}</p>
                </div>

                {currentSpeaker?.id === speaker.id && (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Speaker Stats */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Spreektijd:</span>
                    <div className="font-medium">
                      {formatSpeakingTime(speakerStats[speaker.id]?.totalTime || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Segmenten:</span>
                    <div className="font-medium">
                      {speakerStats[speaker.id]?.segments || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Speaker */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">➕ Nieuwe Spreker Toevoegen</h4>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Naam van nieuwe spreker"
              className="modern-input flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handlers.handleAddSpeaker(e.target.value.trim());
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = e.target.parentElement.querySelector('input');
                if (input.value.trim()) {
                  handlers.handleAddSpeaker(input.value.trim());
                  input.value = '';
                }
              }}
              className="btn-secondary px-4 py-2"
            >
              Toevoegen
            </button>
          </div>
        </div>
      </div>

      {/* Participants Overview */}
      <div className="modern-card p-6">
        <h3 className="text-lg font-medium mb-4">👥 Geregistreerde Deelnemers</h3>
        
        {meeting?.participants?.length > 0 ? (
          <div className="space-y-3">
            {meeting.participants.map((participant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: getSpeakerColor(index + 1) }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{participant.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{participant.role}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {participant.email && (
                    <div>📧 {participant.email}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Geen geregistreerde deelnemers
          </div>
        )}
      </div>
    </div>
  );

  // Tab: Agenda Tracking
  const AgendaTab = () => (
    <div className="space-y-6">
      {/* Agenda Progress */}
      <div className="modern-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">📋 Agenda Voortgang</h3>
          <div className="text-sm text-gray-600">
            Item {currentAgendaIndex + 1} van {meeting?.agenda_items?.length || 0}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Voortgang</span>
            <span>{calculateAgendaProgress(meeting?.agenda_items, currentAgendaIndex)}%</span>
          </div>
          <div className="agenda-progress">
            <div 
              className="agenda-progress-bar"
              style={{ 
                width: `${calculateAgendaProgress(meeting?.agenda_items, currentAgendaIndex)}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handlers.handlePreviousAgendaItem}
            disabled={currentAgendaIndex <= 0}
            className="btn-neutral px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Vorige
          </button>
          
          <span className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
            Huidige: {currentAgendaIndex + 1}
          </span>
          
          <button
            onClick={handlers.handleNextAgendaItem}
            disabled={!meeting?.agenda_items || currentAgendaIndex >= meeting.agenda_items.length - 1}
            className="btn-neutral px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende →
          </button>
        </div>
      </div>

      {/* Agenda Items List */}
      <div className="modern-card p-6">
        <h3 className="text-lg font-medium mb-4">📝 Agenda Items</h3>
        
        {meeting?.agenda_items?.length > 0 ? (
          <div className="space-y-3">
            {meeting.agenda_items.map((item, index) => (
              <div
                key={index}
                onClick={() => handlers.handleGoToAgendaItem(index)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  index === currentAgendaIndex
                    ? 'border-blue-500 bg-blue-50'
                    : index < currentAgendaIndex
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === currentAgendaIndex
                        ? 'bg-blue-500'
                        : index < currentAgendaIndex
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    {agendaStartTimes[index] && (
                      <div className="text-gray-600">
                        Started: {formatTimestamp(agendaStartTimes[index])}
                      </div>
                    )}
                    {item.estimated_duration && (
                      <div className="text-gray-500">
                        ~{item.estimated_duration} min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Geen agenda items gedefinieerd
          </div>
        )}
      </div>
    </div>
  );

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'transcription':
        return <TranscriptionTab />;
      case 'participants':
        return <ParticipantsTab />;
      case 'agenda':
        return <AgendaTab />;
      default:
        return <TranscriptionTab />;
    }
  };

  return (
    <div className="mt-6">
      {renderTabContent()}
    </div>
  );
};

export default MeetingRoomTabs;