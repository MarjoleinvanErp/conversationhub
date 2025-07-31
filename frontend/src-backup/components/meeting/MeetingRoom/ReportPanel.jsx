import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Edit3, 
  Save, 
  X, 
  ChevronUp,
  ChevronDown,
  RefreshCw, 
  AlertCircle, 
  Shield,
  Download
} from './Icons.jsx';
import reportService from '../../../services/api/reportService.js';

const ReportPanel = ({ 
  meetingId, 
  meeting, 
  isExpanded,
  onToggle,
  // Refresh props (consistent met andere panels)
  onRefresh,
  isRefreshing = false
}) => {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Load reports when component mounts
  useEffect(() => {
    if (meetingId) {
      loadReports();
    }
  }, [meetingId]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await reportService.getReports(meetingId);
      
      if (result.success) {
        setReports(result.data);
        
        // Load the latest report with sections - PREFER STRUCTURED REPORTS
        if (result.data.length > 0) {
          // First try to find a structured report (with sections)
          const structuredReport = result.data.find(report => 
            report.report_type === 'structured' && report.sections_count > 0
          );
          
          if (structuredReport) {
            await loadReport(structuredReport.id);
          } else {
            // Fallback to the latest report (first in array)
            const latestReport = result.data[0];
            await loadReport(latestReport.id);
          }
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Fout bij laden verslagen');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (reportId) => {
    try {
      const result = await reportService.getReport(meetingId, reportId);
      
      if (result.success) {
        setCurrentReport(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setError('Fout bij laden verslag');
    }
  };

  const startEditingSection = (section) => {
    setEditingSection(section.id);
    setEditingContent(section.content);
    setEditingTitle(section.title);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingContent('');
    setEditingTitle('');
  };

  const saveSection = async () => {
    if (!editingSection) return;

    setSaving(true);
    try {
      const result = await reportService.updateSection(
        meetingId, 
        currentReport.id, 
        editingSection, 
        {
          content: editingContent,
          title: editingTitle
        }
      );

      if (result.success) {
        // Update the section in current report
        setCurrentReport(prev => ({
          ...prev,
          sections: prev.sections.map(section => 
            section.id === editingSection 
              ? { ...section, content: editingContent, title: editingTitle, is_auto_generated: false }
              : section
          )
        }));
        
        cancelEditing();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      setError('Fout bij opslaan sectie');
    } finally {
      setSaving(false);
    }
  };

  const togglePrivacyFiltering = async () => {
    if (!currentReport) return;

    try {
      const result = await reportService.togglePrivacyFiltering(meetingId, currentReport.id);
      
      if (result.success) {
        setCurrentReport(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error toggling privacy filtering:', error);
      setError('Fout bij privacy filtering');
    }
  };

  const downloadHtml = async () => {
    if (!currentReport) return;

    try {
      const result = await reportService.exportHtml(meetingId, currentReport.id);
      
      if (result.success) {
        const blob = new Blob([result.data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.title || 'verslag'}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error downloading HTML:', error);
      setError('Fout bij downloaden');
    }
  };

  // Manual refresh handler (consistent met andere panels)
  const handleManualRefresh = async () => {
    if (onRefresh) {
      await onRefresh('report');
    } else {
      await loadReports();
    }
  };

  const getSectionIcon = (sectionType) => {
    switch (sectionType) {
      case 'summary': return '📝';
      case 'participants': return '👥';
      case 'agenda_item': return '📋';
      case 'action_items': return '✅';
      case 'decisions': return '⚖️';
      case 'custom': return '📄';
      default: return '📄';
    }
  };

  const getSectionColor = (sectionType) => {
    switch (sectionType) {
      case 'summary': return 'bg-blue-50 border-blue-200';
      case 'participants': return 'bg-green-50 border-green-200';
      case 'agenda_item': return 'bg-purple-50 border-purple-200';
      case 'action_items': return 'bg-orange-50 border-orange-200';
      case 'decisions': return 'bg-yellow-50 border-yellow-200';
      case 'custom': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Determine if we're in a loading state
  const isLoadingState = loading || isRefreshing;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header - CONSISTENT STYLE */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <h3 className="font-semibold text-slate-900">Gespreksverslagen</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {reports.length} verslag{reports.length !== 1 ? 'en' : ''}
          </span>
          {currentReport?.sections?.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {currentReport.sections.length} secties
            </span>
          )}
          {currentReport?.privacy_filtered && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              🔒 Privacy
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Privacy Toggle - alleen tonen als er een report is EN expanded */}
          {currentReport && isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePrivacyFiltering();
              }}
              className={`p-1 rounded transition-colors ${
                currentReport.privacy_filtered
                  ? 'text-red-600 hover:bg-red-100'
                  : 'text-green-600 hover:bg-green-100'
              }`}
              title={currentReport.privacy_filtered ? 'Privacy filtering UIT' : 'Privacy filtering AAN'}
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Download Button - alleen tonen als er een report is EN expanded */}
          {currentReport && isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadHtml();
              }}
              className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
              title="Download HTML"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Refresh Button - EXACT SAME STYLE AS WhisperTranscriptionPanel */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManualRefresh();
            }}
            disabled={isRefreshing || loading}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-blue-600 hover:bg-blue-50 border-blue-200 shadow-sm'
            }`}
            title="Vernieuw verslagen"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>

          {/* Expand/Collapse Button - CONSISTENT STYLE */}
          <button
            onClick={onToggle}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Panel Content - ONLY SHOW WHEN EXPANDED */}
      {isExpanded && (
        <div className="p-4">
          {/* Refresh Status Indicator - CONSISTENT STYLE */}
          {isRefreshing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-800">Verslagen worden vernieuwd...</span>
              </div>
            </div>
          )}

          {/* Loading State - ONLY when loading initially, not when refreshing */}
          {loading && !isRefreshing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-800">Verslagen laden...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Content */}
          <div className={`${isRefreshing ? 'opacity-60' : ''}`}>
            {/* Show loading skeleton ONLY when initially loading AND no data yet */}
            {loading && !currentReport && !isRefreshing ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-4 bg-blue-50 border-blue-200 animate-pulse">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-blue-200 rounded"></div>
                      <div className="h-4 bg-blue-200 rounded w-32"></div>
                      <div className="h-3 bg-blue-100 rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-blue-100 rounded w-full"></div>
                      <div className="h-3 bg-blue-100 rounded w-3/4"></div>
                      <div className="h-3 bg-blue-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !currentReport && !isLoadingState ? (
              /* Show "no report" message only when NOT loading */
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen verslag beschikbaar</h3>
                <p className="text-gray-500 mb-4">
                  Gebruik de groene "Verslag" knop rechtsonder om een verslag te genereren
                </p>
              </div>
            ) : currentReport ? (
              /* Show report content */
              <div className="space-y-6">
                {/* Report Header Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{currentReport.report_title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>v{currentReport.version_number}</span>
                      <span>•</span>
                      <span>{currentReport.sections?.length || 0} secties</span>
                      {currentReport.privacy_filtered && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">🔒 Privacy gefilterd</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Gegenereerd door {currentReport.generated_by} op {' '}
                    {currentReport.generated_at ? new Date(currentReport.generated_at).toLocaleString('nl-NL') : 'Onbekend'}
                  </p>
                  
                  {/* Report Selection Dropdown - NIEUW */}
                  {reports.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beschikbare verslagen ({reports.length}):
                      </label>
                      <select
                        value={currentReport.id}
                        onChange={(e) => loadReport(parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {reports.map((report) => (
                          <option key={report.id} value={report.id}>
                            {report.report_title} (v{report.version_number}) - {report.sections_count} secties - {report.report_type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Report Sections */}
                {currentReport.sections && currentReport.sections.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      📄 Verslagsecties
                    </h3>
                    
                    {currentReport.sections.map((section) => (
                      <div 
                        key={section.id} 
                        className={`rounded-lg border p-4 ${getSectionColor(section.section_type)}`}
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{getSectionIcon(section.section_type)}</span>
                            <h4 className="font-medium text-gray-900">{section.title}</h4>
                            {section.contains_privacy_info && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                🔒 Privacy info
                              </span>
                            )}
                            {!section.is_auto_generated && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                ✏️ Bewerkt
                              </span>
                            )}
                          </div>
                          
                          {section.is_editable && editingSection !== section.id && (
                            <button
                              onClick={() => startEditingSection(section)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Sectie bewerken"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Section Content */}
                        {editingSection === section.id ? (
                          <div className="space-y-3">
                            {/* Edit Title */}
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                              placeholder="Sectie titel..."
                            />
                            
                            {/* Edit Content */}
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={section.section_type === 'summary' ? 6 : 4}
                              placeholder="Sectie inhoud..."
                            />
                            
                            {/* Edit Buttons */}
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                              >
                                <X className="w-3 h-3 mr-1 inline" />
                                Annuleren
                              </button>
                              <button
                                onClick={saveSection}
                                disabled={saving}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                              >
                                <Save className="w-3 h-3 mr-1 inline" />
                                {saving ? 'Opslaan...' : 'Opslaan'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {section.content || 'Geen inhoud beschikbaar'}
                          </div>
                        )}

                        {/* Section Meta Info */}
                        {section.last_edited_at && !section.is_auto_generated && (
                          <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
                            Laatst bewerkt: {new Date(section.last_edited_at).toLocaleString('nl-NL')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Geen secties beschikbaar</h3>
                    <p className="text-gray-500">
                      Dit verslag heeft nog geen secties. Dit kan een oud verslag zijn.
                    </p>
                  </div>
                )}

                {/* Report Statistics - CONSISTENT STYLE */}
                {currentReport.sections && currentReport.sections.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">📊 Verslag Statistieken</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Totaal secties:</span>
                        <div className="font-medium">{currentReport.sections.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Bewerkte secties:</span>
                        <div className="font-medium text-blue-600">
                          {currentReport.sections.filter(s => !s.is_auto_generated).length}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Privacy secties:</span>
                        <div className="font-medium text-red-600">
                          {currentReport.sections.filter(s => s.contains_privacy_info).length}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <div className="font-medium text-green-600">{currentReport.status}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPanel;