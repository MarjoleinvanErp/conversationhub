import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import meetingService from '../../services/api/meetingService';

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

  // Agenda als simpele string die we splitsen op enters
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
      // Filter out empty participants
      const validParticipants = participants.filter(p => p.name.trim() !== '');

      // Convert agenda text to agenda items
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

      // Combine date and time for scheduled_at
      let scheduled_at = null;
      if (formData.scheduled_date && formData.scheduled_time) {
        scheduled_at = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      }

      const meetingData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        scheduled_at: scheduled_at,
        duration_minutes: 60, // Default duration
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nieuw Gesprek Aanmaken</h1>
        <p className="text-gray-600">Stel een gesprek in met deelnemers en agenda</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="conversation-card">
          <h2 className="text-lg font-medium mb-4">Gesprek Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="conversation-input w-full"
                placeholder="Naam van het gesprek"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type Gesprek
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="conversation-input w-full"
              >
                <option value="general">Algemeen</option>
                <option value="participation">Participatie</option>
                <option value="care">Zorg</option>
                <option value="education">Onderwijs</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geplande Datum
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                    className="conversation-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={setToday}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border"
                  >
                    Vandaag
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geplande Tijd
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleInputChange}
                  className="conversation-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschrijving Gesprek
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="conversation-input w-full"
                rows="3"
                placeholder="Korte beschrijving van het gesprek"
              />
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="conversation-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Deelnemers</h2>
            <button
              type="button"
              onClick={addParticipant}
              className="conversation-button text-sm"
            >
              + Deelnemer Toevoegen
            </button>
          </div>

          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded">
                <input
                  type="text"
                  placeholder="Naam"
                  value={participant.name}
                  onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  className="conversation-input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={participant.email}
                  onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  className="conversation-input"
                />
                <select
                  value={participant.role}
                  onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                  className="conversation-input"
                >
                  <option value="participant">Deelnemer</option>
                  <option value="facilitator">Begeleider</option>
                  <option value="observer">Observant</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Verwijderen
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Simplified Agenda */}
        <div className="conversation-card">
          <h2 className="text-lg font-medium mb-4">Agenda</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda Punten (elk punt op een nieuwe regel)
            </label>
            <textarea
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
              className="conversation-input w-full"
              rows="6"
              placeholder="Welkom en kennismaking&#10;Huidige situatie bespreken&#10;Doelen opstellen&#10;Vervolgstappen&#10;Afsluiting"
            />
            <p className="text-sm text-gray-500 mt-1">
              Typ elk agendapunt op een nieuwe regel. Druk op Enter voor het volgende punt.
            </p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="conversation-card">
          <h2 className="text-lg font-medium mb-4">Privacy Instellingen</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Privacy Niveau
              </label>
              <select
                name="privacy_level"
                value={formData.privacy_level}
                onChange={handleInputChange}
                className="conversation-input w-full md:w-auto"
              >
                <option value="minimal">Minimaal - Alleen basistekst</option>
                <option value="standard">Standaard - Gevoelige data gefilterd</option>
                <option value="detailed">Gedetailleerd - Alles opgenomen</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="auto_transcription"
                checked={formData.auto_transcription}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                Automatische transcriptie inschakelen
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className="conversation-button disabled:opacity-50"
          >
            {loading ? 'Aanmaken...' : 'Gesprek Aanmaken'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeeting;