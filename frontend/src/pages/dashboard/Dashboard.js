import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService';

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

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      scheduled: 'Gepland',
      active: 'Actief',
      completed: 'Voltooid',
      cancelled: 'Geannuleerd',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      general: 'Algemeen',
      participation: 'Participatie',
      care: 'Zorg',
      education: 'Onderwijs',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-conversation-muted">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welkom bij ConversationHub - Jouw intelligente gespreksondersteuning
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button 
            onClick={() => navigate('/meetings/create')}
            className="conversation-button"
          >
            Nieuw Gesprek
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">G</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Totaal Gesprekken
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {meetings.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Actieve Gesprekken
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {meetings.filter(m => m.status === 'active').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">P</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Privacy Filters
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  Active
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="conversation-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">V</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Voltooid
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {meetings.filter(m => m.status === 'completed').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="conversation-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Recente Gesprekken
          </h3>
          <button 
            onClick={() => navigate('/meetings')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Alle gesprekken →
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nog geen gesprekken aangemaakt</p>
            <button 
              onClick={() => navigate('/meetings/create')}
              className="conversation-button"
            >
              Eerste Gesprek Aanmaken
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.slice(0, 5).map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                    {getStatusBadge(meeting.status)}
                    <span className="text-xs text-gray-500">{getTypeLabel(meeting.type)}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {meeting.participants?.length || 0} deelnemers • {meeting.agenda_items?.length || 0} agenda punten
                    {meeting.scheduled_at && (
                      <span> • {new Date(meeting.scheduled_at).toLocaleString('nl-NL')}</span>
                    )}
                  </div>
                </div>
<div className="flex space-x-2">
  {meeting.status === 'scheduled' && (
    <button 
      onClick={() => navigate(`/meetings/${meeting.id}/room`)}
      className="text-sm text-green-600 hover:text-green-700"
    >
      Start
    </button>
  )}
  {meeting.status === 'active' && (
    <button 
      onClick={() => navigate(`/meetings/${meeting.id}/room`)}
      className="text-sm text-orange-600 hover:text-orange-700"
    >
      Deelnemen
    </button>

  )}
  <button className="text-sm text-primary-600 hover:text-primary-700">
    Bekijk
  </button>
</div>


   </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;