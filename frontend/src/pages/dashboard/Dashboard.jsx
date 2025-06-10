import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const result = await meetingService.getAllMeetings();
      if (result.success) {
        setMeetings(result.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter meetings based on status
  const openMeetings = meetings.filter(meeting => 
    meeting.status === 'scheduled' || meeting.status === 'active'
  );
  
  const closedMeetings = meetings.filter(meeting => 
    meeting.status === 'completed' || meeting.status === 'cancelled'
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { class: 'status-scheduled', label: 'Gepland', icon: '📅' },
      active: { class: 'status-active', label: 'Actief', icon: '🔴' },
      completed: { class: 'status-completed', label: 'Voltooid', icon: '✅' },
      cancelled: { class: 'status-cancelled', label: 'Geannuleerd', icon: '❌' },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    
    return (
      <span className={`status-badge ${config.class}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const types = {
      general: { label: 'Algemeen', icon: '💼' },
      participation: { label: 'Participatie', icon: '🤝' },
      care: { label: 'Zorg', icon: '❤️' },
      education: { label: 'Onderwijs', icon: '🎓' },
    };
    
    const config = types[type] || types.general;
    return (
      <span className="flex items-center space-x-1 text-sm text-gray-600">
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const renderMeetingList = (meetings, title, emptyMessage, showCreateButton = false) => (
    <div className="modern-card p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
          <span>📋</span>
          <span>{title}</span>
          <span className="text-lg text-gray-500">({meetings.length})</span>
        </h2>
        {showCreateButton && (
          <button 
            onClick={() => navigate('/meetings/create')}
            className="btn-primary px-6 py-3"
          >
            <span className="mr-2">🚀</span>
            Nieuw Gesprek
          </button>
        )}
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {emptyMessage}
          </h3>
          {showCreateButton && (
            <div>
              <p className="text-gray-600 mb-6">
                Begin vandaag nog met je eerste intelligente gesprek!
              </p>
              <button 
                onClick={() => navigate('/meetings/create')}
                className="btn-primary px-8 py-3"
              >
                <span className="mr-2">➕</span>
                Eerste Gesprek Aanmaken
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="modern-card p-4 hover-lift border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">{meeting.title}</h3>
                    {getStatusBadge(meeting.status)}
                    {getTypeLabel(meeting.type)}
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>👥</span>
                      <span>{meeting.participants?.length || 0} deelnemers</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>📝</span>
                      <span>{meeting.agenda_items?.length || 0} agenda punten</span>
                    </span>
                    {meeting.scheduled_at && (
                      <span className="flex items-center space-x-1">
                        <span>🕐</span>
                        <span>{new Date(meeting.scheduled_at).toLocaleString('nl-NL')}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  {meeting.status === 'scheduled' && (
                    <button 
                      onClick={() => navigate(`/meetings/${meeting.id}/room`)}
                      className="btn-success px-4 py-2"
                    >
                      🚀 Start
                    </button>
                  )}
                  {meeting.status === 'active' && (
                    <button 
                      onClick={() => navigate(`/meetings/${meeting.id}/room`)}
                      className="btn-primary px-4 py-2"
                    >
                      🎙️ Deelnemen
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(`/meetings/${meeting.id}`)}
                    className="btn-neutral px-4 py-2"
                  >
                    👁️ Bekijk
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">


      {/* Open Meetings Section */}
      {renderMeetingList(
        openMeetings, 
        "Actieve Gesprekken", 
        "Geen actieve gesprekken",
        true // Show create button for empty open meetings
      )}

      {/* Closed Meetings Section */}
      {renderMeetingList(
        closedMeetings, 
        "Voltooide Gesprekken", 
        "Geen voltooide gesprekken",
        false // No create button for closed meetings
      )}
    </div>
  );
};

export default Dashboard;