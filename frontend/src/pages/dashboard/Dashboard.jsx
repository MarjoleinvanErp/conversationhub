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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-4">
          Welkom bij ConversationHub
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Jouw intelligente gespreksondersteuning platform
        </p>
        <button 
          onClick={() => navigate('/meetings/create')}
          className="btn-primary text-lg px-8 py-4"
        >
          <span className="mr-2">🚀</span>
          Nieuw Gesprek Starten
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Totaal Gesprekken', 
            value: meetings.length, 
            icon: '💬', 
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
          },
          { 
            title: 'Actieve Gesprekken', 
            value: meetings.filter(m => m.status === 'active').length, 
            icon: '🔴', 
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
          },
          { 
            title: 'Privacy Filters', 
            value: 'Actief', 
            icon: '🛡️', 
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-600'
          },
          { 
            title: 'Voltooid', 
            value: meetings.filter(m => m.status === 'completed').length, 
            icon: '✅', 
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
          },
        ].map((stat, index) => (
          <div key={index} className="modern-card p-6 hover-lift">
            <div className={`${stat.bgColor} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meetings Section */}
      <div className="modern-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
            <span>📋</span>
            <span>Recente Gesprekken</span>
          </h2>
          <button 
            onClick={() => navigate('/meetings')}
            className="btn-neutral hover-scale"
          >
            Alle gesprekken →
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nog geen gesprekken aangemaakt
            </h3>
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
        ) : (
          <div className="space-y-4">
            {meetings.slice(0, 5).map((meeting) => (
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="modern-card p-6 text-center hover-lift">
          <div className="text-4xl mb-4">🎤</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Live Transcriptie</h3>
          <p className="text-gray-600 text-sm mb-4">
            Start direct een gesprek met real-time transcriptie
          </p>
          <button 
            onClick={() => navigate('/meetings/create')}
            className="btn-primary w-full"
          >
            Start Nu
          </button>
        </div>

        <div className="modern-card p-6 text-center hover-lift">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics</h3>
          <p className="text-gray-600 text-sm mb-4">
            Bekijk statistieken van je gesprekken
          </p>
          <button 
            onClick={() => navigate('/analytics')}
            className="btn-neutral w-full"
          >
            Bekijk Stats
          </button>
        </div>

        <div className="modern-card p-6 text-center hover-lift">
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Instellingen</h3>
          <p className="text-gray-600 text-sm mb-4">
            Configureer privacy en voorkeuren
          </p>
          <button 
            onClick={() => navigate('/settings')}
            className="btn-neutral w-full"
          >
            Configureren
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;