import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService.js';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general',
    scheduled_date: '',
    scheduled_time: '',
    privacy_level: 'standard',
    auto_transcription: true,
  });

  const [participants, setParticipants] = useState([
    { name: '', email: '', role: 'participant' }
  ]);

  const [agendaText, setAgendaText] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const setToday = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      scheduled_date: dateString
    }));
  };

  const setNow = () => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    setFormData(prev => ({
      ...prev,
      scheduled_time: timeString
    }));
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '', role: 'participant' }]);
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index, field, value) => {
    const updated = participants.map((participant, i) => 
      i === index ? { ...participant, [field]: value } : participant
    );
    setParticipants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validParticipants = participants.filter(p => p.name.trim() !== '');
      const agendaItems = agendaText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .map((title, index) => ({
          title: title,
          description: '',
          estimated_duration: 10,
          order: index + 1
        }));

      let scheduled_at = null;
      if (formData.scheduled_date && formData.scheduled_time) {
        scheduled_at = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      }

      const meetingData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        scheduled_at: scheduled_at,
        duration_minutes: 60,
        privacy_level: formData.privacy_level,
        auto_transcription: formData.auto_transcription,
        participants: validParticipants,
        agenda_items: agendaItems,
      };

      const result = await meetingService.createMeeting(meetingData);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Er is een fout opgetreden');
      }
    } catch (error) {
      setError('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const meetingTypes = [
    { value: 'general', label: 'Algemeen', icon: '💼', desc: 'Standaard gesprek' },
    { value: 'participation', label: 'Participatie', icon: '🤝', desc: 'Re-integratie en werkbegeleiding' },
    { value: 'care', label: 'Zorg', icon: '❤️', desc: 'Zorgtraject en ondersteuning' },
    { value: 'education', label: 'Onderwijs', icon: '🎓', desc: 'Studieloopbaan en begeleiding' },
  ];

  const privacyLevels = [
    { value: 'minimal', label: 'Minimaal', icon: '🔒', desc: 'Alleen basistekst' },
    { value: 'standard', label: 'Standaard', icon: '🛡️', desc: 'Gevoelige data gefilterd' },
    { value: 'detailed', label: 'Gedetailleerd', icon: '📝', desc: 'Alles opgenomen' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Nieuw Gesprek Aanmaken</h1>
        <p className="text-gray-600">Stel een gesprek in met deelnemers en agenda</p>
      </div>

      {error && (
        <div className="modern-card p-4 bg-red-50 border-red-200 text-red-600">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <span>📋</span>
            <span>Gesprek Details</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📌 Titel van het Gesprek *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="Bijvoorbeeld: Intake gesprek John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Beschrijving
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="modern-input"
                rows="3"
                placeholder="Korte beschrijving van het doel en context van het gesprek"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Geplande Datum
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                    className="modern-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={setToday}
                    className="btn-neutral px-3 py-2 text-sm"
                  >
                    Vandaag
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🕐 Geplande Tijd
                </label>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleInputChange}
                    className="modern-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={setNow}
                    className="btn-neutral px-3 py-2 text-sm"
                  >
                    Nu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Type Selection */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <span>🎯</span>
            <span>Type Gesprek</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetingTypes.map((type) => (
              <label key={type.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`modern-card p-4 border-2 transition-all duration-300 ${
                  formData.type === type.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.desc}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="modern-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <span>👥</span>
              <span>Deelnemers</span>
            </h2>
            <button
              type="button"
              onClick={addParticipant}
              className="btn-secondary px-4 py-2"
            >
              <span className="mr-1">➕</span>
              Toevoegen
            </button>
          </div>

          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={index} className="modern-card p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Naam *</label>
                    <input
                      type="text"
                      placeholder="Volledige naam"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                      className="modern-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="email@voorbeeld.nl"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      className="modern-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                    <select
                      value={participant.role}
                      onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                      className="modern-input text-sm"
                    >
                      <option value="participant">Deelnemer</option>
                      <option value="facilitator">Begeleider</option>
                      <option value="observer">Observant</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="btn-danger px-3 py-2 text-sm w-full"
                      disabled={participants.length === 1}
                    >
                      🗑️ Verwijder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <span>📋</span>
            <span>Agenda Punten</span>
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda Items (elk punt op een nieuwe regel)
            </label>
            <textarea
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
              className="modern-input"
              rows="6"
              placeholder="Welkom en kennismaking&#10;Huidige situatie bespreken&#10;Doelen opstellen&#10;Vervolgstappen&#10;Afsluiting"
            />
            <p className="text-sm text-gray-500 mt-2 flex items-center space-x-1">
              <span>💡</span>
              <span>Typ elk agendapunt op een nieuwe regel. Druk op Enter voor het volgende punt.</span>
            </p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="modern-card p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <span>🔐</span>
            <span>Privacy Instellingen</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Privacy Niveau</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {privacyLevels.map((level) => (
                  <label key={level.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="privacy_level"
                      value={level.value}
                      checked={formData.privacy_level === level.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`modern-card p-4 border-2 transition-all duration-300 ${
                      formData.privacy_level === level.value 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="text-center">
                        <span className="text-2xl mb-2 block">{level.icon}</span>
                        <h3 className="font-semibold text-gray-800">{level.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{level.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="modern-card p-4 bg-blue-50 border-blue-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="auto_transcription"
                  checked={formData.auto_transcription}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-blue-800">🎤 Automatische transcriptie inschakelen</span>
                  <p className="text-sm text-blue-600">Real-time spraak naar tekst conversie</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 py-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-neutral px-6 py-3"
          >
            ❌ Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8 py-3"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Aanmaken...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>🚀</span>
                <span>Gesprek Aanmaken</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeeting;