// frontend/src/components/meeting/MeetingRoom/ReportPanel.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Edit3, Save, X, RefreshCw, AlertCircle, CheckCircle, Eye } from './Icons.jsx';

const ReportPanel = ({ 
  meetingId, 
  meeting, 
  recordingTime, 
  isRefreshing = false,
  reportData,
  setReportData,
  liveTranscriptions = [],
  whisperTranscriptions = [],
  onRefresh
}) => {
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState({});
  const [saving, setSaving] = useState(false);

  // Load report when component mounts or meetingId changes
  useEffect(() => {
    if (meetingId) {
      loadReport();
    }
  }, [meetingId]);

  const loadReport = async () => {
    if (!meetingId) return;
    
    setLoadingReport(true);
    setReportError(null);
    
    try {
      const response = await fetch(`/api/n8n/meeting-report/${meetingId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setReport(result.data);
          initializeEditingContent(result.data);
        } else {
          setReport(null);
        }
      } else if (response.status === 404) {
        setReport(null);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setReportError('Fout bij laden verslag');
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const initializeEditingContent = (reportData) => {
    setEditingContent({
      summary: reportData.summary || '',
      key_points: reportData.key_points || [],
      action_items: reportData.action_items || [],
      next_steps: reportData.next_steps || [],
      agenda_items: reportData.agenda_items || []
    });
  };

  const handleEdit = () => {
    if (report) {
      initializeEditingContent(report);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (report) {
      initializeEditingContent(report);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/n8n/meeting-report/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(editingContent)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReport(result.data);
          setIsEditing(false);
          console.log('✅ Report saved successfully');
        } else {
          alert('Fout bij opslaan: ' + result.error);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Fout bij opslaan verslag');
    } finally {
      setSaving(false);
    }
  };

  const updateListItem = (field, index, value) => {
    setEditingContent(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? value : item
      )
    }));
  };

  const addListItem = (field) => {
    setEditingContent(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeListItem = (field, index) => {
    setEditingContent(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Mock report data voor development
  const mockReport = {
    summary: "Dit was een productief gesprek waarbij de voortgang van het project werd besproken. Belangrijke beslissingen zijn genomen over de volgende stappen.",
    agenda_items: [
      {
        title: "Projectvoortgang bespreken",
        discussion: "Het team heeft goede vooruitgang geboekt. Alle mijlpalen voor Q1 zijn behaald.",
        status: "completed"
      },
      {
        title: "Budget evaluatie",
        discussion: "Het budget ligt op koers. Kleine aanpassingen nodig voor Q2.",
        status: "completed"
      },
      {
        title: "Planning volgende fase",
        discussion: "Start van fase 2 gepland voor volgende maand.",
        status: "in_progress"
      }
    ],
    key_points: [
      "Project ligt op schema",
      "Budget aanpassingen nodig voor Q2",
      "Team werkt goed samen",
      "Nieuwe fase start volgende maand"
    ],
    action_items: [
      "Budget voorstel opstellen voor Q2",
      "Planning maken voor fase 2",
      "Team uitbreiden met 2 developers"
    ],
    next_steps: [
      "Volgende week: budget meeting",
      "Over 2 weken: start fase 2",
      "Maandelijks: voortgang evalueren"
    ],
    generated_at: new Date().toISOString()
  };

  // Voor development: gebruik mock data als er geen report is
  const displayReport = report || (process.env.NODE_ENV === 'development' ? mockReport : null);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Gespreksverslag</h2>
              <p className="text-sm text-blue-700">
                {meeting?.title || 'Meeting Verslag'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Refresh button */}
            <button
              onClick={loadReport}
              disabled={loadingReport}
              className="p-2 rounded-lg border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors"
              title="Ververs verslag"
            >
              <RefreshCw className={`w-4 h-4 ${loadingReport ? 'animate-spin' : ''}`} />
            </button>

            {/* Edit/Save buttons */}
            {displayReport && !isEditing && (
              <button
                onClick={handleEdit}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">Bewerken</span>
              </button>
            )}

            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{saving ? 'Opslaan...' : 'Opslaan'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Annuleren</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loadingReport ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600">Verslag laden...</span>
          </div>
        ) : reportError ? (
          <div className="flex items-center p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-700">{reportError}</span>
          </div>
        ) : !displayReport ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen verslag beschikbaar</h3>
            <p className="text-gray-500 mb-4">
              Gebruik de groene "Verslag" knop rechtsonder om een verslag te genereren
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Meeting Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">📅 Datum:</span>
                  <div className="text-gray-600">
                    {meeting?.start_time 
                      ? new Date(meeting.start_time).toLocaleDateString('nl-NL')
                      : new Date().toLocaleDateString('nl-NL')
                    }
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">👥 Deelnemers:</span>
                  <div className="text-gray-600">{meeting?.participants?.length || 0}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">⏱️ Duur:</span>
                  <div className="text-gray-600">
                    {recordingTime ? Math.floor(recordingTime / 60) : 0} minuten
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                📝 Samenvatting
              </h3>
              {isEditing ? (
                <textarea
                  value={editingContent.summary}
                  onChange={(e) => setEditingContent(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Voer een samenvatting van het gesprek in..."
                />
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {displayReport.summary || 'Geen samenvatting beschikbaar'}
                  </p>
                </div>
              )}
            </div>

            {/* Agenda Items */}
            {displayReport.agenda_items && displayReport.agenda_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  📋 Agendapunten Bespreking
                </h3>
                <div className="space-y-3">
                  {displayReport.agenda_items.map((item, index) => (
                    <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-green-900">{item.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'completed' 
                            ? 'bg-green-200 text-green-800'
                            : item.status === 'in_progress'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {item.status === 'completed' ? '✅ Voltooid' : 
                           item.status === 'in_progress' ? '🔄 Bezig' : '⏳ Open'}
                        </span>
                      </div>
                      {item.discussion && (
                        <p className="text-green-700 text-sm leading-relaxed">
                          {item.discussion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Points */}
            {displayReport.key_points && displayReport.key_points.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  🎯 Belangrijkste Punten
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {editingContent.key_points.map((point, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={typeof point === 'string' ? point : point.topic || ''}
                          onChange={(e) => updateListItem('key_points', index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Voer een belangrijk punt in..."
                        />
                        <button
                          onClick={() => removeListItem('key_points', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem('key_points')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Punt toevoegen
                    </button>
                  </div>
                ) : (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <ul className="space-y-2">
                      {displayReport.key_points.map((point, index) => (
                        <li key={index} className="flex items-start text-gray-700">
                          <span className="text-orange-500 mr-3 mt-1">•</span>
                          <span className="leading-relaxed">
                            {typeof point === 'string' ? point : point.topic || point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Items */}
            {displayReport.action_items && displayReport.action_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  ✅ Actiepunten
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {editingContent.action_items.map((action, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={typeof action === 'string' ? action : action.action || ''}
                          onChange={(e) => updateListItem('action_items', index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Voer een actiepunt in..."
                        />
                        <button
                          onClick={() => removeListItem('action_items', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem('action_items')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Actie toevoegen
                    </button>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <ul className="space-y-2">
                      {displayReport.action_items.map((action, index) => (
                        <li key={index} className="flex items-start text-gray-700">
                          <span className="text-red-500 mr-3 mt-1">→</span>
                          <span className="leading-relaxed">
                            {typeof action === 'string' ? action : action.action || action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            {displayReport.next_steps && displayReport.next_steps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  ➡️ Vervolgstappen
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {editingContent.next_steps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={typeof step === 'string' ? step : step.step || step.action || ''}
                          onChange={(e) => updateListItem('next_steps', index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Voer een vervolgstap in..."
                        />
                        <button
                          onClick={() => removeListItem('next_steps', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem('next_steps')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Stap toevoegen
                    </button>
                  </div>
                ) : (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <ul className="space-y-2">
                      {displayReport.next_steps.map((step, index) => (
                        <li key={index} className="flex items-start text-gray-700">
                          <span className="text-purple-500 mr-3 mt-1">▶</span>
                          <span className="leading-relaxed">
                            {typeof step === 'string' ? step : step.step || step.action || step}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Generation Info */}
            {displayReport.generated_at && (
              <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                <p>
                  📅 Verslag gegenereerd op: {new Date(displayReport.generated_at).toLocaleString('nl-NL')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPanel;