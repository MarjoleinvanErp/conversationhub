import React, { useState, useEffect } from 'react';

const MeetingTypes = () => {
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    privacy_level: 'standard',
    auto_transcription: true,
    privacy_filters: []
  });

  // Privacy filter options
  const privacyFilterOptions = [
    { value: 'names', label: 'Namen filteren' },
    { value: 'addresses', label: 'Adressen filteren' },
    { value: 'phone_numbers', label: 'Telefoonnummers filteren' },
    { value: 'email_addresses', label: 'E-mailadressen filteren' },
    { value: 'bsn', label: 'BSN-nummers filteren' },
    { value: 'financial', label: 'Financiële gegevens filteren' }
  ];

  const categoryOptions = [
    { value: 'general', label: 'Algemeen' },
    { value: 'participation', label: 'Participatie' },
    { value: 'care', label: 'Zorg' },
    { value: 'education', label: 'Onderwijs' }
  ];

  const privacyLevelOptions = [
    { value: 'low', label: 'Laag - Basis filtering' },
    { value: 'standard', label: 'Standaard - Gemiddelde filtering' },
    { value: 'high', label: 'Hoog - Uitgebreide filtering' },
    { value: 'strict', label: 'Strikt - Maximale filtering' }
  ];

  useEffect(() => {
    loadMeetingTypes();
  }, []);

  const loadMeetingTypes = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockData = [
        {
          id: 1,
          name: 'Intake Gesprek',
          description: 'Eerste kennismaking met nieuwe cliënten',
          category: 'general',
          privacy_level: 'high',
          auto_transcription: true,
          privacy_filters: ['names', 'addresses', 'phone_numbers']
        },
        {
          id: 2,
          name: 'Participatie Overleg',
          description: 'Overleg over participatie trajecten',
          category: 'participation',
          privacy_level: 'strict',
          auto_transcription: true,
          privacy_filters: ['names', 'addresses', 'phone_numbers', 'bsn', 'financial']
        },
        {
          id: 3,
          name: 'Zorgoverleg',
          description: 'Multidisciplinair zorgoverleg',
          category: 'care',
          privacy_level: 'strict',
          auto_transcription: false,
          privacy_filters: ['names', 'addresses', 'phone_numbers', 'bsn']
        }
      ];
      
      setMeetingTypes(mockData);
    } catch (error) {
      setError('Er ging iets mis bij het laden van de meeting types');
      console.error('Error loading meeting types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      privacy_level: 'standard',
      auto_transcription: true,
      privacy_filters: []
    });
    setShowCreateModal(true);
  };

  const handleEdit = (meetingType) => {
    setEditingType(meetingType);
    setFormData({
      name: meetingType.name,
      description: meetingType.description,
      category: meetingType.category,
      privacy_level: meetingType.privacy_level,
      auto_transcription: meetingType.auto_transcription,
      privacy_filters: meetingType.privacy_filters || []
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingType) {
        // Update existing
        console.log('Updating meeting type:', editingType.id, formData);
      } else {
        // Create new
        console.log('Creating new meeting type:', formData);
      }
      
      // Close modals and reload data
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingType(null);
      loadMeetingTypes();
    } catch (error) {
      setError('Er ging iets mis bij het opslaan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Weet je zeker dat je dit meeting type wilt verwijderen?')) {
      try {
        // Mock API call - replace with actual implementation
        console.log('Deleting meeting type:', id);
        loadMeetingTypes();
      } catch (error) {
        setError('Er ging iets mis bij het verwijderen');
      }
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      general: 'Algemeen',
      participation: 'Participatie',
      care: 'Zorg',
      education: 'Onderwijs'
    };
    return categories[category] || category;
  };

  const getPrivacyLevelColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      standard: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      strict: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getPrivacyLevelLabel = (level) => {
    const labels = {
      low: 'Laag',
      standard: 'Standaard',
      high: 'Hoog',
      strict: 'Strikt'
    };
    return labels[level] || level;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrivacyFilterChange = (filterValue) => {
    setFormData(prev => ({
      ...prev,
      privacy_filters: prev.privacy_filters.includes(filterValue)
        ? prev.privacy_filters.filter(f => f !== filterValue)
        : [...prev.privacy_filters, filterValue]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Meeting Types</h1>
        <p className="text-slate-600">
          Beheer verschillende types gesprekken met specifieke privacy-instellingen
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6">
        <button
          onClick={handleCreateNew}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Nieuw Meeting Type</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button
            onClick={() => setError('')}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Meeting Types Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Naam</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Categorie</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Privacy Level</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Auto Transcriptie</th>
                <th className="text-left py-3 px-4 font-medium text-slate-900">Privacy Filters</th>
                <th className="text-right py-3 px-4 font-medium text-slate-900">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                // Loading skeletons
                [...Array(3)].map((_, index) => (
                  <tr key={index}>
                    <td className="py-4 px-4">
                      <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : meetingTypes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-slate-500">
                    Geen meeting types gevonden
                  </td>
                </tr>
              ) : (
                meetingTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{type.name}</div>
                        <div className="text-sm text-slate-500">{type.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block bg-slate-100 text-slate-800 px-2 py-1 rounded-full text-sm">
                        {getCategoryLabel(type.category)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm ${getPrivacyLevelColor(type.privacy_level)}`}>
                        {getPrivacyLevelLabel(type.privacy_level)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                        type.auto_transcription 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.auto_transcription ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-slate-600">
                        {type.privacy_filters && type.privacy_filters.length > 0 
                          ? `${type.privacy_filters.length} filter(s)` 
                          : 'Geen filters'
                        }
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Bewerken"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Verwijderen"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Nieuw Meeting Type</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Naam
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beschrijving
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Categorie
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Privacy Level
                </label>
                <select
                  name="privacy_level"
                  value={formData.privacy_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {privacyLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="auto_transcription"
                    checked={formData.auto_transcription}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Auto-transcriptie inschakelen
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Privacy Filters
                </label>
                <div className="space-y-2">
                  {privacyFilterOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.privacy_filters.includes(option.value)}
                        onChange={() => handlePrivacyFilterChange(option.value)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Meeting Type Aanmaken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Meeting Type Bewerken</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Naam
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beschrijving
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Categorie
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Privacy Level
                </label>
                <select
                  name="privacy_level"
                  value={formData.privacy_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {privacyLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="auto_transcription"
                    checked={formData.auto_transcription}
                    onChange={handleInputChange}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Auto-transcriptie inschakelen
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Privacy Filters
                </label>
                <div className="space-y-2">
                  {privacyFilterOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.privacy_filters.includes(option.value)}
                        onChange={() => handlePrivacyFilterChange(option.value)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Wijzigingen Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingTypes;