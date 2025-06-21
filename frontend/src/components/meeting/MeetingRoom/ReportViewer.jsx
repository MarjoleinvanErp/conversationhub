import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Edit3, 
  Save, 
  X, 
  Download, 
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import n8nService from '../../../services/api/n8nService.js';

const ReportViewer = ({ meetingId, meeting, isOpen, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Load report when component opens
  useEffect(() => {
    if (isOpen && meetingId) {
      loadReport();
    }
  }, [isOpen, meetingId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await n8nService.getMeetingReport(meetingId);
      if (result.success) {
        setReport(result.data);
        setEditData({
          summary: result.data.summary || '',
          key_points: result.data.key_points || [],
          action_items: result.data.action_items || [],
          next_steps: result.data.next_steps || []
        });
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await n8nService.updateMeetingReport(meetingId, editData);
      if (result.success) {
        setReport(result.data);
        setEditing(false);
      } else {
        alert('Fout bij opslaan: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Fout bij opslaan verslag');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadHTML = () => {
    if (report?.html_content) {
      const blob = new Blob([report.html_content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verslag-${meeting?.title || 'meeting'}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const addListItem = (field) => {
    setEditData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const updateListItem = (field, index, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (field, index) => {
    setEditData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gespreksverslag</h2>
              <p className="text-sm text-gray-500">{meeting?.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {report && (
              <>
                <button
                  onClick={handleDownloadHTML}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download HTML
                </button>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Bewerken
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {saving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditData({
                          summary: report?.summary || '',
                          key_points: report?.key_points || [],
                          action_items: report?.action_items || [],
                          next_steps: report?.next_steps || []
                        });
                      }}
                      className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuleren
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Verslag laden...</span>
            </div>
          ) : !report ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen verslag beschikbaar</h3>
              <p className="text-gray-500">Er is nog geen verslag gegenereerd voor dit gesprek.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Meeting Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span>
                      {meeting?.start_time 
                        ? new Date(meeting.start_time).toLocaleDateString('nl-NL', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Datum onbekend'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 mr-2" />
                    <span>{meeting?.duration || 0} minuten</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-500 mr-2" />
                    <span>{meeting?.participants?.length || 0} deelnemers</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Samenvatting</h3>
                {editing ? (
                  <textarea
                    value={editData.summary}
                    onChange={(e) => setEditData(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Voer een samenvatting in..."
                  />
                ) : (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{report.summary || 'Geen samenvatting beschikbaar'}</p>
                  </div>
                )}
              </div>

              {/* Key Points */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Belangrijkste Punten</h3>
                {editing ? (
                  <div className="space-y-2">
                    {(editData.key_points || []).map((point, index) => (
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
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      + Punt toevoegen
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(report.key_points || []).map((point, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">
                          {typeof point === 'string' ? point : (point.topic || '')}
                          {typeof point === 'object' && point.description && (
                            <span className="text-gray-500 block text-sm">{point.description}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Actiepunten</h3>
                {editing ? (
                  <div className="space-y-2">
                    {(editData.action_items || []).map((action, index) => (
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
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      + Actie toevoegen
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(report.action_items || []).map((action, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">
                          {typeof action === 'string' ? action : (action.action || '')}
                          {typeof action === 'object' && action.speaker && (
                            <span className="text-gray-500 block text-sm">Genoemd door: {action.speaker}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vervolgstappen</h3>
                {editing ? (
                  <div className="space-y-2">
                    {(editData.next_steps || []).map((step, index) => (
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
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      + Stap toevoegen
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(report.next_steps || []).map((step, index) => (
                      <li key={index} className="flex items-start">
                        <ExternalLink className="w-4 h-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">
                          {typeof step === 'string' ? step : (step.step || step.action || '')}
                          {typeof step === 'object' && (step.deadline || step.responsible) && (
                            <div className="text-gray-500 text-sm">
                              {step.deadline && <span>Deadline: {step.deadline}</span>}
                              {step.responsible && <span className="ml-2">Verantwoordelijke: {step.responsible}</span>}
                            </div>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Statistics */}
              {report.statistics && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistieken</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {report.statistics.total_words && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{report.statistics.total_words.toLocaleString()}</div>
                          <div className="text-gray-500">Woorden</div>
                        </div>
                      )}
                      {report.statistics.total_transcriptions && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{report.statistics.total_transcriptions}</div>
                          <div className="text-gray-500">Segmenten</div>
                        </div>
                      )}
                      {report.statistics.participants_count && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{report.statistics.participants_count}</div>
                          <div className="text-gray-500">Deelnemers</div>
                        </div>
                      )}
                      {report.statistics.agenda_items_count && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{report.statistics.agenda_items_count}</div>
                          <div className="text-gray-500">Agendapunten</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Info */}
              {report.generated_at && (
                <div className="text-sm text-gray-500 border-t pt-4">
                  <p>
                    Verslag gegenereerd op: {new Date(report.generated_at).toLocaleString('nl-NL')}
                    {report.last_edited_at && (
                      <span className="ml-4">
                        Laatst bewerkt: {new Date(report.last_edited_at).toLocaleString('nl-NL')}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;