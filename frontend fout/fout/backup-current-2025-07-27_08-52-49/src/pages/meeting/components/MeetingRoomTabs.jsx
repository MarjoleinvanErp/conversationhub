import React, { useState, useEffect } from 'react';
import { Clock, Users, FileText, Mic2 } from 'lucide-react';

// Import nieuwe clean AutoRecordingPanel
import { AutoRecordingPanel } from '../../../components/recording/clean';

const MeetingRoomTabs = ({ 
  meeting, 
  onUpdateMeeting, 
  currentAgendaIndex = 0, 
  agendaStartTimes = {},
  transcriptionData = [],
  whisperData = []
}) => {
  // State voor active tab
  const [activeTab, setActiveTab] = useState('recording');
  const [expandedPanels, setExpandedPanels] = useState({
    recording: true,
    transcription: false,
    participants: false,
    agenda: false
  });

  // Helper functions
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('nl-NL');
  };

  const calculateAgendaProgress = (agendaItems, currentIndex) => {
    if (!agendaItems || agendaItems.length === 0) return 0;
    return Math.round(((currentIndex + 1) / agendaItems.length) * 100);
  };

  const getSpeakerColor = (speakerIndex) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
    ];
    return colors[speakerIndex % colors.length];
  };

  const togglePanel = (panelName) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // Tab definitions
  const tabs = [
    {
      id: 'recording',
      label: 'Opname',
      icon: Mic2,
      count: null,
      color: 'blue'
    },
    {
      id: 'transcription',
      label: 'Transcriptie',
      icon: FileText,
      count: transcriptionData?.length || 0,
      color: 'green'
    },
    {
      id: 'participants',
      label: 'Deelnemers',
      icon: Users,
      count: meeting?.participants?.length || 0,
      color: 'purple'
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Clock,
      count: meeting?.agenda_items?.length || 0,
      color: 'orange'
    }
  ];

  // Tab: Recording (AutoRecordingPanel)
  const RecordingTab = () => (
    <div className="space-y-6">
      <AutoRecordingPanel
        meetingId={meeting?.id || 'unknown'}
        isExpanded={expandedPanels.recording}
        onToggleExpand={() => togglePanel('recording')}
        participants={meeting?.participants?.map(p => ({
          id: p.id?.toString() || Math.random().toString(),
          name: p.name || 'Onbekend',
          role: p.role || 'Deelnemer',
          status: p.status || 'online',
          color: getSpeakerColor(meeting.participants.indexOf(p))
        })) || []}
        onRecordingStart={(session) => {
          console.log('📹 Recording started:', session);
          // Optioneel: update meeting status
          if (onUpdateMeeting) {
            onUpdateMeeting({
              ...meeting,
              recording_status: 'active',
              recording_started_at: new Date().toISOString()
            });
          }
        }}
        onRecordingStop={(session) => {
          console.log('⏹️ Recording stopped:', session);
          // Optioneel: update meeting status
          if (onUpdateMeeting) {
            onUpdateMeeting({
              ...meeting,
              recording_status: 'stopped',
              recording_ended_at: new Date().toISOString()
            });
          }
        }}
        onChunkSent={(chunk) => {
          console.log('📤 Chunk sent to N8N:', chunk);
        }}
        onError={(error) => {
          console.error('❌ Recording error:', error);
        }}
      />
    </div>
  );

  // Tab: Transcriptie
  const TranscriptionTab = () => (
    <div className="space-y-6">
      {/* Live Transcriptie */}
      <div className="modern-card p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-green-600" />
          Live Transcriptie
        </h3>
        
        {transcriptionData && transcriptionData.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {transcriptionData.map((item, index) => (
              <div key={index} className="transcription-item bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm mt-1"
                    style={{ backgroundColor: getSpeakerColor(item.speaker_index || 1) }}
                  >
                    {item.speaker?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">
                        {item.speaker || 'Spreker'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.timestamp ? formatTimestamp(item.timestamp) : ''}
                      </span>
                    </div>
                    <p className="text-gray-700">{item.text}</p>
                    {item.confidence && (
                      <div className="text-xs text-gray-500 mt-1">
                        Vertrouwen: {Math.round(item.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nog geen transcriptie data beschikbaar
          </div>
        )}
      </div>

      {/* Whisper Enhanced Transcriptie */}
      {whisperData && whisperData.length > 0 && (
        <div className="modern-card p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Enhanced Transcriptie (Whisper)
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {whisperData.map((item, index) => (
              <div key={index} className="transcription-item bg-blue-50">
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm mt-1"
                    style={{ backgroundColor: getSpeakerColor(item.speaker_index || 1) }}
                  >
                    {item.speaker?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">
                        {item.speaker || 'Spreker'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.timestamp ? formatTimestamp(item.timestamp) : ''}
                      </span>
                    </div>
                    <p className="text-gray-700">{item.text}</p>
                    {item.confidence && (
                      <div className="text-xs text-gray-500 mt-1">
                        Vertrouwen: {Math.round(item.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Tab: Deelnemers
  const ParticipantsTab = () => (
    <div className="space-y-6">
      <div className="modern-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">👥 Geregistreerde Deelnemers</h3>
          <span className="text-sm text-gray-600">
            {meeting?.participants?.length || 0} deelnemers
          </span>
        </div>

        {meeting?.participants && meeting.participants.length > 0 ? (
          <div className="space-y-3">
            {meeting.participants.map((participant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: getSpeakerColor(index + 1) }}
                  >
                    {participant.name?.charAt(0)?.toUpperCase() || 'U'}
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
                  <div className={`inline-block px-2 py-1 rounded text-xs ${
                    participant.status === 'online' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.status || 'offline'}
                  </div>
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${calculateAgendaProgress(meeting?.agenda_items, currentAgendaIndex)}%` 
              }}
            />
          </div>
        </div>

        {/* Agenda Items */}
        {meeting?.agenda_items && meeting.agenda_items.length > 0 ? (
          <div className="space-y-4">
            {meeting.agenda_items.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
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
      case 'recording':
        return <RecordingTab />;
      case 'transcription':
        return <TranscriptionTab />;
      case 'participants':
        return <ParticipantsTab />;
      case 'agenda':
        return <AgendaTab />;
      default:
        return <RecordingTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all ${
                isActive
                  ? `bg-white text-${tab.color}-600 shadow-sm`
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive
                    ? `bg-${tab.color}-100 text-${tab.color}-700`
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MeetingRoomTabs;