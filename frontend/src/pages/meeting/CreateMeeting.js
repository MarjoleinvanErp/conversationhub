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
    scheduled_at: '',
    duration_minutes: 60,
    privacy_level: 'standard',
    auto_transcription: true,
  });

  const [participants, setParticipants] = useState([
    { name: '', email: '', role: 'participant' }
  ]);

  const [agendaItems, setAgendaItems] = useState([
    { title: '', description: '', estimated_duration: 10 }
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const addAgendaItem = () => {
    setAgendaItems([...agendaItems, { title: '', description: '', estimated_duration: 10 }]);
  };

  const removeAgendaItem = (index) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const updateAgendaItem = (index, field, value) => {
    const updated = agendaItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setAgendaItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filter out empty participants and agenda items
      const validParticipants = participants.filter(p => p.name.trim() !== '');
      const validAgendaItems = agendaItems.filter(item => item.title.trim() !== '');

      const meetingData = {
        ...formData,
        participants: validParticipants,
        agenda_items: validAgendaItems,
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geplande Tijd
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleInputChange}
                className="conversation-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duur (minuten)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                className="conversation-input w-full"
                min="15"
                max="480"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="conversation-input w-full"
              rows="3"
              placeholder="Optionele beschrijving van het gesprek"
            />
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
                  placeholder="Email (optioneel)"
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

        {/* Agenda Items */}
        <div className="conversation-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Agenda</h2>
            <button
              type="button"
              onClick={addAgendaItem}
              className="conversation-button text-sm"
            >
              + Agenda Punt Toevoegen
            </button>
          </div>

          <div className="space-y-3">
            {agendaItems.map((item, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                  <input
                    type="text"
                    placeholder="Agenda punt titel"
                    value={item.title}
                    onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                    className="conversation-input"
                  />
                  <input
                    type="number"
                    placeholder="Tijd (min)"
                    value={item.estimated_duration}
                    onChange={(e) => updateAgendaItem(index, 'estimated_duration', parseInt(e.target.value))}
                    className="conversation-input"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Verwijderen
                  </button>
                </div>
                <textarea
                  placeholder="Beschrijving (optioneel)"
                  value={item.description}
                  onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                  className="conversation-input w-full"
                  rows="2"
                />
              </div>
            ))}
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