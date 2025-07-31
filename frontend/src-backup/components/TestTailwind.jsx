import React from 'react';

const TestTailwind = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text text-center mb-8">
          🎯 Tailwind CSS Test Page
        </h1>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <div className="modern-card p-6 hover-lift">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
            <p className="text-slate-600 mb-4">Overzicht van alle gesprekken</p>
            <button className="btn-primary w-full">
              Bekijk Dashboard
            </button>
          </div>
          
          {/* Card 2 */}
          <div className="modern-card p-6 hover-lift">
            <div className="text-3xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold mb-2">Live Transcriptie</h3>
            <p className="text-slate-600 mb-4">Real-time spraak naar tekst</p>
            <button className="btn-secondary w-full">
              Start Transcriptie
            </button>
          </div>
          
          {/* Card 3 */}
          <div className="modern-card p-6 hover-lift">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Deelnemers</h3>
            <p className="text-slate-600 mb-4">Beheer gesprekdeelnemers</p>
            <button className="btn-neutral w-full">
              Toon Deelnemers
            </button>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="modern-card p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Status Badges</h2>
          <div className="flex flex-wrap gap-2">
            <span className="status-badge status-active">
              🟢 Actief
            </span>
            <span className="status-badge status-scheduled">
              🔵 Gepland
            </span>
            <span className="status-badge status-completed">
              ⚫ Voltooid
            </span>
            <span className="status-badge status-cancelled">
              🔴 Geannuleerd
            </span>
          </div>
        </div>
        
        {/* Buttons Test */}
        <div className="modern-card p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Button Styles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary">
              🚀 Primary
            </button>
            <button className="btn-secondary">
              ✅ Secondary
            </button>
            <button className="btn-neutral">
              ⚙️ Neutral
            </button>
            <button className="btn-danger">
              🗑️ Danger
            </button>
          </div>
        </div>
        
        {/* Form Elements */}
        <div className="modern-card p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                placeholder="je.naam@voorbeeld.nl"
                className="modern-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message
              </label>
              <textarea 
                rows="4"
                placeholder="Typ je bericht hier..."
                className="modern-input resize-none"
              ></textarea>
            </div>
            
            <div className="flex gap-2">
              <button className="btn-primary">
                📤 Versturen
              </button>
              <button className="btn-neutral">
                ❌ Annuleren
              </button>
            </div>
          </div>
        </div>
        
        {/* Glass Effect */}
        <div className="glass-container p-6">
          <h2 className="text-2xl font-semibold mb-4">🛡️ Privacy Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">GDPR Compliance</span>
              <span className="font-semibold text-green-600">✅ 100%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-full"></div>
            </div>
            <p className="text-sm text-slate-600">
              Alle privacy instellingen zijn correct geconfigureerd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTailwind;