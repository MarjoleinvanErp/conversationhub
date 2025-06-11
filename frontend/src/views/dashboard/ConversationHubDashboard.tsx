import React from 'react';

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, gradient }: any) => (
  <div className="modern-card p-6 hover-lift">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className={`text-3xl ${gradient ? 'gradient-text' : ''}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Recent Meetings Component
const RecentMeetings = () => {
  const meetings = [
    {
      id: 1,
      title: 'Intake Gesprek - Maria van Der Berg',
      time: '14:30 - 15:15',
      status: 'completed',
      participants: 2,
      type: 'Intake',
      duration: '45 min',
    },
    {
      id: 2,
      title: 'Voortgang Review - Ahmed Hassan',
      time: '10:00 - 10:45',
      status: 'active',
      participants: 3,
      type: 'Review',
      duration: '45 min',
    },
    {
      id: 3,
      title: 'Team Overleg Participatie',
      time: '09:00 - 09:30',
      status: 'scheduled',
      participants: 5,
      type: 'Team Meeting',
      duration: '30 min',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'active':
        return 'status-active';
      case 'scheduled':
        return 'status-scheduled';
      default:
        return 'status-completed';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Voltooid';
      case 'active':
        return 'Actief';
      case 'scheduled':
        return 'Gepland';
      default:
        return status;
    }
  };

  return (
    <div className="modern-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recente Gesprekken</h2>
        <button className="btn-neutral text-sm">Alles bekijken</button>
      </div>
      
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="glass-card p-4 hover-lift">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{meeting.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {meeting.time} • {meeting.duration}
                </p>
                <div className="flex items-center space-x-2">
                  <span className={`status-badge ${getStatusBadge(meeting.status)}`}>
                    {getStatusLabel(meeting.status)}
                  </span>
                  <span className="status-badge bg-gray-100 text-gray-700">
                    {meeting.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {meeting.participants} deelnemers
                  </span>
                </div>
              </div>
              <button className="btn-neutral">⋯</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => (
  <div className="modern-card p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Snelle Acties</h2>
    
    <div className="space-y-3">
      <button className="btn-primary w-full text-left justify-start">
        📹 Start Nieuw Gesprek
      </button>
      
      <button className="btn-secondary w-full text-left justify-start">
        📅 Plan Gesprek
      </button>
      
      <button className="btn-neutral w-full text-left justify-start">
        📝 Bekijk Sjablonen
      </button>
    </div>
  </div>
);

// Privacy Status Component
const PrivacyStatus = () => (
  <div className="glass-container p-6" style={{
    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
  }}>
    <div className="flex items-center mb-4">
      <span className="text-2xl mr-2">🛡️</span>
      <h2 className="text-xl font-semibold text-gray-900">Privacy Status</h2>
    </div>
    
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">AVG Compliance</span>
          <span className="font-semibold text-green-600">100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Data Filtering</span>
          <span className="font-semibold text-green-600">98.7%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.7%' }}></div>
        </div>
      </div>
      
      <hr className="border-gray-200" />
      
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Laatste 7 dagen
        </p>
        <p className="text-sm">
          <strong>47</strong> gevoelige data punten automatisch gefilterd
        </p>
        <p className="text-sm">
          <strong>0</strong> privacy schendingen gedetecteerd
        </p>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const ConversationHubDashboard = () => {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Welkom terug, Jan
        </h1>
        <p className="text-lg text-gray-600">
          Hier is een overzicht van je gesprekken en activiteiten
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Gesprekken Vandaag"
          value="5"
          subtitle="2 meer dan gisteren"
          icon="📹"
          gradient={true}
        />
        <StatsCard
          title="Actieve Deelnemers"
          value="12"
          subtitle="8 in live gesprekken"
          icon="👥"
          gradient={true}
        />
        <StatsCard
          title="Gesprekstijd"
          value="3.2u"
          subtitle="Deze week"
          icon="⏱️"
          gradient={true}
        />
        <StatsCard
          title="Templates Gebruikt"
          value="8"
          subtitle="Meest populair: Intake"
          icon="📝"
          gradient={true}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Meetings */}
        <div className="lg:col-span-2">
          <RecentMeetings />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          <PrivacyStatus />
        </div>
      </div>
    </div>
  );
};

export default ConversationHubDashboard;