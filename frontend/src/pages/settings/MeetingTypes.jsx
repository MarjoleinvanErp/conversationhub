import React, { useState, useEffect } from 'react';
import meetingTypeService from '../../services/api/meetingTypeService.js';

const MeetingTypes = () => {
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testingType, setTestingType] = useState(null);

  // Form state voor meeting type
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    auto_anonymize: false,
    auto_generate_report: true,
    estimated_duration_minutes: 60,
    is_active: true,
    privacy_filters: {
      medical_terms: [],
      personal_data: [],
      sensitive_topics: []
    },
    participant_filters: {
      exclude_from_report: [],
      anonymize_roles: []
    },
    default_agenda_items: [],
    allowed_participant_roles: [],
    privacy_levels_by_role: {},
    report_template: {
      sections: {},
      tone: 'professional_neutral',
      exclude_personal_details: false
    },
    metadata: {}
  });

  // Test modal state
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadMeetingTypes();
  }, []);

  const loadMeetingTypes = async () => {
    try {
      setLoading(true);
      const types = await meetingTypeService.getAllMeetingTypes();
      setMeetingTypes(types);
    } catch (err) {
      setError('Fout bij laden meeting types: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      auto_anonymize: false,
      auto_generate_report: true,
      estimated_duration_minutes: 60,
      is_active: true,
      privacy_filters: {
        medical_terms: [],
        personal_data: [],
        sensitive_topics: []
      },
      participant_filters: {
        exclude_from_report: [],
        anonymize_roles: []
      },
      default_agenda_items: [],
      allowed_participant_roles: [],
      privacy_levels_by_role: {},
      report_template: {
        sections: {},
        tone: 'professional_neutral',
        exclude_personal_details: false
      },
      metadata: {}
    });
    setShowModal(true);
  };

  const handleEdit = (meetingType) => {
    setEditingType(meetingType);
    setFormData({
      ...meetingType,
      privacy_filters: meetingType.privacy_filters || {
        medical_terms: [],
        personal_data: [],
        sensitive_topics: []
      },
      participant_filters: meetingType.participant_filters || {
        exclude_from_report: [],
        anonymize_roles: []
      },
      default_agenda_items: meetingType.default_agenda_items || [],
      allowed_participant_roles: meetingType.allowed_participant_roles || [],
      privacy_levels_by_role: meetingType.privacy_levels_by_role || {},
      report_template: meetingType.report_template || {
        sections: {},
        tone: 'professional_neutral',
        exclude_personal_details: false
      },
      metadata: meetingType.metadata || {}
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingType) {
        await meetingTypeService.updateMeetingType(editingType.id, formData);
      } else {
        await meetingTypeService.createMeetingType(formData);
      }
      setShowModal(false);
      loadMeetingTypes();
    } catch (err) {
      setError('Fout bij opslaan: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Weet je zeker dat je dit meeting type wilt deactiveren?')) {
      try {
        await meetingTypeService.deleteMeetingType(id);
        loadMeetingTypes();
      } catch (err) {
        setError('Fout bij verwijderen: ' + err.message);
      }
    }
  };

  const handleTestPrivacy = (meetingType) => {
    setTestingType(meetingType);
    setTestText('');
    setTestResult(null);
    setShowTestModal(true);
  };

  const runPrivacyTest = async () => {
    try {
      const result = await meetingTypeService.testPrivacyFilters(testingType.id, testText);
      setTestResult(result);
    } catch (err) {
      setError('Fout bij testen privacy filters: ' + err.message);
    }
  };

  const addArrayItem = (field, subfield = null) => {
    if (subfield) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subfield]: [...(prev[field][subfield] || []), '']
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), '']
      }));
    }
  };

  const updateArrayItem = (field, index, value, subfield = null) => {
    if (subfield) {
      const newArray = [...(formData[field][subfield] || [])];
      newArray[index] = value;
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subfield]: newArray
        }
      }));
    } else {
      const newArray = [...(formData[field] || [])];
      newArray[index] = value;
      setFormData(prev => ({
        ...prev,
        [field]: newArray
      }));
    }
  };

  const removeArrayItem = (field, index, subfield = null) => {
    if (subfield) {
      const newArray = [...(formData[field][subfield] || [])];
      newArray.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subfield]: newArray
        }
      }));
    } else {
      const newArray = [...(formData[field] || [])];
      newArray.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        [field]: newArray
      }));
    }
  };

  const addAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      default_agenda_items: [
        ...(prev.default_agenda_items || []),
        { title: '', estimated_duration: 10 }
      ]
    }));
  };

  const updateAgendaItem = (index, field, value) => {
    const newItems = [...(formData.default_agenda_items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      default_agenda_items: newItems
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Meeting types laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 Meeting Types Configuratie
            </h1>
            <p className="text-gray-600">
              Beheer de verschillende soorten gesprekken en hun instellingen
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Nieuw Meeting Type</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Meeting Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {meetingTypes.map((type) => (
          <div key={type.id} data-testid="meeting-type-card" className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {type.display_name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">
                    {type.name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    type.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {type.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {type.description || 'Geen beschrijving'}
              </p>

              {/* Quick Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">⏱️ Geschatte duur:</span>
                  <span className="text-gray-900">
                    {type.estimated_duration_minutes || 60} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">🔐 Auto anonymiseren:</span>
                  <span className={type.auto_anonymize ? 'text-green-600' : 'text-gray-400'}>
                    {type.auto_anonymize ? '✅ Ja' : '❌ Nee'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">📝 Auto rapport:</span>
                  <span className={type.auto_generate_report ? 'text-green-600' : 'text-gray-400'}>
                    {type.auto_generate_report ? '✅ Ja' : '❌ Nee'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">📋 Standaard agenda:</span>
                  <span className="text-gray-900">
                    {(type.default_agenda_items || []).length} items
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  ✏️ Bewerken
                </button>
                
                <button
                  onClick={() => handleTestPrivacy(type)}
                  className="flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  🧪 Test Privacy
                </button>
                
                <button
                  onClick={() => handleDelete(type.id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Geen meeting types */}
      {meetingTypes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nog geen meeting types
          </h3>
          <p className="text-gray-600 mb-6">
            Maak je eerste meeting type aan om te beginnen
          </p>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Eerste Meeting Type Aanmaken
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingType ? '✏️ Meeting Type Bewerken' : '➕ Nieuw Meeting Type'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basis Informatie */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📋 Basis Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Systeemnaam (slug)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="bijv: wmo_keukentafel"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weergavenaam
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="bijv: WMO Keukentafelgesprek"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschrijving
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Beschrijf waar dit meeting type voor wordt gebruikt..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Geschatte duur (minuten)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_minutes: parseInt(e.target.value) || 60 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_anonymize}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_anonymize: e.target.checked }))}
                        className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        🔐 Auto anonymiseren
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-4 pt-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_generate_report}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_generate_report: e.target.checked }))}
                        className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        📝 Auto rapport genereren
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Privacy Filters */}
              <div>
                <h3 className="text-lg font-semibold mb-4">🔐 Privacy Filters</h3>
                
                {/* Medical Terms */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medische termen (worden gefilterd)
                  </label>
                  <div className="space-y-2">
                    {(formData.privacy_filters.medical_terms || []).map((term, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={term}
                          onChange={(e) => updateArrayItem('privacy_filters', index, e.target.value, 'medical_terms')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="bijv: diagnose, medicatie"
                        />
                        <button
                          onClick={() => removeArrayItem('privacy_filters', index, 'medical_terms')}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem('privacy_filters', 'medical_terms')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ➕ Medische term toevoegen
                    </button>
                  </div>
                </div>

                {/* Personal Data */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persoonlijke gegevens (worden gefilterd)
                  </label>
                  <div className="space-y-2">
                    {(formData.privacy_filters.personal_data || []).map((term, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={term}
                          onChange={(e) => updateArrayItem('privacy_filters', index, e.target.value, 'personal_data')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="bijv: bsn, sofinummer"
                        />
                        <button
                          onClick={() => removeArrayItem('privacy_filters', index, 'personal_data')}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem('privacy_filters', 'personal_data')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ➕ Persoonlijk gegeven toevoegen
                    </button>
                  </div>
                </div>

                {/* Sensitive Topics */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gevoelige onderwerpen (worden gefilterd)
                  </label>
                  <div className="space-y-2">
                    {(formData.privacy_filters.sensitive_topics || []).map((term, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={term}
                          onChange={(e) => updateArrayItem('privacy_filters', index, e.target.value, 'sensitive_topics')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="bijv: schulden, financiële problemen"
                        />
                        <button
                          onClick={() => removeArrayItem('privacy_filters', index, 'sensitive_topics')}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addArrayItem('privacy_filters', 'sensitive_topics')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ➕ Gevoelig onderwerp toevoegen
                    </button>
                  </div>
                </div>
              </div>

              {/* Standaard Agenda */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📋 Standaard Agenda Items</h3>
                <div className="space-y-3">
                  {(formData.default_agenda_items || []).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Agendapunt titel"
                      />
                      <input
                        type="number"
                        value={item.estimated_duration || 10}
                        onChange={(e) => updateAgendaItem(index, 'estimated_duration', parseInt(e.target.value) || 10)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="120"
                      />
                      <span className="text-sm text-gray-500">min</span>
                      <button
                        onClick={() => removeArrayItem('default_agenda_items', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addAgendaItem}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ➕ Agendapunt toevoegen
                  </button>
                </div>
              </div>

              {/* Toegestane Participant Rollen */}
              <div>
                <h3 className="text-lg font-semibold mb-4">👥 Toegestane Participant Rollen</h3>
                <div className="space-y-2">
                  {(formData.allowed_participant_roles || []).map((role, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => updateArrayItem('allowed_participant_roles', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="bijv: client, casemanager, begeleider"
                      />
                      <button
                        onClick={() => removeArrayItem('allowed_participant_roles', index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('allowed_participant_roles')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ➕ Rol toevoegen
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingType ? 'Bijwerken' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Test Modal */}
      {showTestModal && testingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  🧪 Privacy Filter Test - {testingType.display_name}
                </h2>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test tekst invoeren
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Voer hier een testtekst in om te zien of privacy filters worden toegepast..."
                />
              </div>

              <button
                onClick={runPrivacyTest}
                disabled={!testText.trim()}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"