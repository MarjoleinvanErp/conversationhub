import React, { useState, useEffect } from 'react';
import { FileText, Download, Send, RefreshCw, ChevronUp, ChevronDown, CheckCircle, Clock, AlertCircle, Loader2 } from './Icons.jsx';
import n8nService from '../../../services/api/n8nService.js';

const ReportPanel = ({
  isExpanded,
  onToggle,
  reportData,
  setReportData,
  recordingTime,
  liveTranscriptions,
  whisperTranscriptions,
  meeting,
  formatTime,
  onRefresh,
  isRefreshing = false
}) => {
  // N8N Integration states
  const [n8nStatus, setN8nStatus] = useState({
    isExporting: false,
    isGeneratingReport: false,
    lastExport: null,
    lastReport: null,
    reports: []
  });
  
  const [exportProgress, setExportProgress] = useState(null);
  const [reportProgress, setReportProgress] = useState(null);

  // Load existing reports on mount
  useEffect(() => {
    if (meeting?.id) {
      loadMeetingReports();
    }
  }, [meeting?.id]);

  // Load existing reports for this meeting
  const loadMeetingReports = async () => {
    try {
      const result = await n8nService.getMeetingReports(meeting.id);
      if (result.success) {
        setN8nStatus(prev => ({
          ...prev,
          reports: result.data || []
        }));
      }
    } catch (error) {
      console.error('Error loading meeting reports:', error);
    }
  };

  // Export meeting data to N8N
  const handleExportToN8N = async () => {
    if (!meeting?.id) {
      alert('Geen meeting geselecteerd');
      return;
    }

    setN8nStatus(prev => ({ ...prev, isExporting: true }));
    setExportProgress({ status: 'starting', message: 'Export wordt gestart...' });

    try {
      const exportOptions = {
        includeTranscriptions: true,
        includeAgenda: true,
        includeParticipants: true,
        includeMetadata: true,
        format: 'complete'
      };

      const result = await n8nService.exportMeetingToN8N(meeting.id, exportOptions);
      
      if (result.success) {
        setExportProgress({ 
          status: 'completed', 
          message: 'Data succesvol naar N8N verzonden',
          exportId: result.export_id
        });
        
        setN8nStatus(prev => ({
          ...prev,
          lastExport: {
            id: result.export_id,
            timestamp: new Date(),
            status: 'completed'
          }
        }));

        // Auto-hide progress after 3 seconds
        setTimeout(() => {
          setExportProgress(null);
        }, 3000);

      } else {
        throw new Error(result.message || 'Export mislukt');
      }

    } catch (error) {
      console.error('Export error:', error);
      setExportProgress({ 
        status: 'error', 
        message: `Export fout: ${error.message}` 
      });
      
      setTimeout(() => {
        setExportProgress(null);
      }, 5000);
    } finally {
      setN8nStatus(prev => ({ ...prev, isExporting: false }));
    }
  };

  // Generate report via N8N
  const handleGenerateReport = async () => {
    if (!meeting?.id) {
      alert('Geen meeting geselecteerd');
      return;
    }

    setN8nStatus(prev => ({ ...prev, isGeneratingReport: true }));
    setReportProgress({ status: 'starting', message: 'Verslag generatie wordt gestart...' });

    try {
      const reportOptions = {
        type: 'standard',
        language: 'nl',
        includeActionItems: true,
        includeSummary: true,
        includeKeyPoints: true,
        includeNextSteps: true,
        format: 'markdown'
      };

      const result = await n8nService.requestReportGeneration(meeting.id, reportOptions);
      
      if (result.success) {
        setReportProgress({ 
          status: 'generating', 
          message: 'Verslag wordt gegenereerd...',
          reportId: result.report_id,
          estimatedCompletion: result.estimated_completion
        });

        // Poll for completion
        pollReportStatus(result.report_id);

      } else {
        throw new Error(result.message || 'Verslag generatie mislukt');
      }

    } catch (error) {
      console.error('Report generation error:', error);
      setReportProgress({ 
        status: 'error', 
        message: `Verslag fout: ${error.message}` 
      });
      
      setTimeout(() => {
        setReportProgress(null);
      }, 5000);
    }
  };

  // Poll report status until completed
  const pollReportStatus = async (reportId, attempts = 0) => {
    const maxAttempts = 30; // Max 5 minutes polling
    
    if (attempts >= maxAttempts) {
      setReportProgress({ 
        status: 'timeout', 
        message: 'Verslag generatie duurt langer dan verwacht' 
      });
      setN8nStatus(prev => ({ ...prev, isGeneratingReport: false }));
      return;
    }

    try {
      const result = await n8nService.getGeneratedReport(reportId);
      
      if (result.success && result.data.status === 'completed') {
        // Report is ready
        setReportProgress({ 
          status: 'completed', 
          message: 'Verslag succesvol gegenereerd!' 
        });

        // Update report data for display
        if (result.data.content) {
          const reportContent = typeof result.data.content === 'string' 
            ? result.data.content 
            : result.data.content.text || JSON.stringify(result.data.content, null, 2);

          setReportData({
            hasReport: true,
            summary: extractSummary(reportContent),
            keyPoints: extractKeyPoints(reportContent),
            actionItems: extractActionItems(reportContent),
            nextSteps: extractNextSteps(reportContent),
            fullContent: reportContent,
            generatedAt: new Date(),
            reportId: reportId
          });
        }

        setN8nStatus(prev => ({
          ...prev,
          isGeneratingReport: false,
          lastReport: {
            id: reportId,
            timestamp: new Date(),
            status: 'completed'
          }
        }));

        // Reload reports list
        await loadMeetingReports();

        // Auto-hide progress after 3 seconds
        setTimeout(() => {
          setReportProgress(null);
        }, 3000);

      } else if (result.data.status === 'failed') {
        throw new Error('Verslag generatie mislukt');
      } else {
        // Still generating, poll again
        setTimeout(() => {
          pollReportStatus(reportId, attempts + 1);
        }, 10000); // Poll every 10 seconds
      }

    } catch (error) {
      console.error('Report polling error:', error);
      setReportProgress({ 
        status: 'error', 
        message: `Polling fout: ${error.message}` 
      });
      setN8nStatus(prev => ({ ...prev, isGeneratingReport: false }));
    }
  };

  // Extract content sections from generated report
  const extractSummary = (content) => {
    const summaryMatch = content.match(/## Samenvatting\s*\n(.*?)(?=\n##|\n$)/s);
    return summaryMatch ? summaryMatch[1].trim() : 'Automatisch gegenereerde samenvatting beschikbaar in volledig verslag.';
  };

  const extractKeyPoints = (content) => {
    const keyPointsMatch = content.match(/## Belangrijkste Punten\s*\n(.*?)(?=\n##|\n$)/s);
    if (keyPointsMatch) {
      return keyPointsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(point => point.length > 0);
    }
    return ['Belangrijkste punten beschikbaar in volledig verslag'];
  };

  const extractActionItems = (content) => {
    const actionMatch = content.match(/## Actiepunten\s*\n(.*?)(?=\n##|\n$)/s);
    if (actionMatch) {
      return actionMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(item => item.length > 0);
    }
    return ['Actiepunten beschikbaar in volledig verslag'];
  };

  const extractNextSteps = (content) => {
    const nextStepsMatch = content.match(/## Vervolgstappen\s*\n(.*?)(?=\n##|\n$)/s);
    if (nextStepsMatch) {
      return nextStepsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(step => step.length > 0);
    }
    return ['Vervolgstappen beschikbaar in volledig verslag'];
  };

  // Download raw data
  const handleDownloadRawData = () => {
    const data = {
      meeting: {
        id: meeting?.id,
        title: meeting?.title,
        date: meeting?.scheduled_start,
        participants: meeting?.participants?.length || 0
      },
      statistics: {
        recording_time: recordingTime,
        live_transcriptions: liveTranscriptions?.length || 0,
        whisper_transcriptions: whisperTranscriptions?.length || 0,
        total_transcriptions: (liveTranscriptions?.length || 0) + (whisperTranscriptions?.length || 0)
      },
      transcriptions: {
        live: liveTranscriptions || [],
        whisper: whisperTranscriptions || []
      },
      export_timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${meeting?.id || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Progress indicator component
  const ProgressIndicator = ({ progress, type }) => {
    if (!progress) return null;

    const getIcon = () => {
      switch (progress.status) {
        case 'starting':
        case 'generating':
          return <Loader2 className="w-4 h-4 animate-spin" />;
        case 'completed':
          return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'error':
        case 'timeout':
          return <AlertCircle className="w-4 h-4 text-red-600" />;
        default:
          return <Clock className="w-4 h-4" />;
      }
    };

    const getBgColor = () => {
      switch (progress.status) {
        case 'completed':
          return 'bg-green-50 border-green-200';
        case 'error':
        case 'timeout':
          return 'bg-red-50 border-red-200';
        default:
          return 'bg-blue-50 border-blue-200';
      }
    };

    const getTextColor = () => {
      switch (progress.status) {
        case 'completed':
          return 'text-green-800';
        case 'error':
        case 'timeout':
          return 'text-red-800';
        default:
          return 'text-blue-800';
      }
    };

    return (
      <div className={`border rounded-lg p-3 mb-4 ${getBgColor()}`}>
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {progress.message}
          </span>
        </div>
      </div>
    );
  };

  const totalTranscriptions = (liveTranscriptions?.length || 0) + (whisperTranscriptions?.length || 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-slate-900">📊 Verslag & Export</h3>
          {reportData?.hasReport && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Verslag beschikbaar
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh('report');
            }}
            disabled={isRefreshing}
            className={`p-2 rounded-lg border transition-colors ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-green-600 hover:bg-green-50 border-green-200 shadow-sm'
            }`}
            title="Vernieuw verslag gegevens"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Expand/Collapse Button */}
          <button
            onClick={onToggle}
            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6">
          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="animate-spin w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Verslag gegevens worden vernieuwd...</span>
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          <ProgressIndicator progress={exportProgress} type="export" />
          <ProgressIndicator progress={reportProgress} type="report" />

          {/* Statistics */}
          <div className={`mb-6 ${isRefreshing ? 'opacity-60' : ''}`}>
            <h4 className="font-medium text-gray-800 mb-3">📈 Meeting Statistieken</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Opname Tijd</span>
                  <span className="font-semibold text-gray-900">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transcripties</span>
                  <span className="font-semibold text-gray-900">
                    {totalTranscriptions}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Live</span>
                  <span className="font-semibold text-green-600">
                    {liveTranscriptions?.length || 0}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Whisper</span>
                  <span className="font-semibold text-blue-600">
                    {whisperTranscriptions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Report Display */}
          {reportData?.hasReport && (
            <div className={`mb-6 ${isRefreshing ? 'opacity-60' : ''}`}>
              <h4 className="font-medium text-gray-800 mb-3">📋 Gegenereerd Verslag</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                
                {/* Summary */}
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Samenvatting</h5>
                  <p className="text-sm text-gray-600">{reportData.summary}</p>
                </div>

                {/* Key Points */}
                {reportData.keyPoints && reportData.keyPoints.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">Belangrijkste Punten</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {reportData.keyPoints.slice(0, 3).map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {point}
                        </li>
                      ))}
                      {reportData.keyPoints.length > 3 && (
                        <li className="text-gray-500 italic">
                          ... en {reportData.keyPoints.length - 3} meer punten
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {reportData.actionItems && reportData.actionItems.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">Actiepunten</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {reportData.actionItems.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                      {reportData.actionItems.length > 3 && (
                        <li className="text-gray-500 italic">
                          ... en {reportData.actionItems.length - 3} meer actiepunten
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {reportData.generatedAt && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Gegenereerd op: {new Date(reportData.generatedAt).toLocaleString('nl-NL')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className={`border-t pt-4 ${isRefreshing ? 'opacity-60' : ''}`}>
            <h4 className="font-medium text-gray-700 mb-3">📤 Export Opties</h4>
            <div className="space-y-2">
              
              {/* Download Raw Data */}
              <button 
                className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm ${
                  isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleDownloadRawData}
                disabled={isRefreshing}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Ruwe Data
              </button>
              
              {/* Export to N8N */}
              <button 
                className={`w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm ${
                  (isRefreshing || n8nStatus.isExporting) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleExportToN8N}
                disabled={isRefreshing || n8nStatus.isExporting}
              >
                {n8nStatus.isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {n8nStatus.isExporting ? 'Versturen...' : 'Verstuur naar N8N'}
              </button>
              
              {/* Generate Report */}
              <button 
                className={`w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm ${
                  (isRefreshing || n8nStatus.isGeneratingReport) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleGenerateReport}
                disabled={isRefreshing || n8nStatus.isGeneratingReport}
              >
                {n8nStatus.isGeneratingReport ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {n8nStatus.isGeneratingReport ? 'Genereren...' : 'Genereer N8N Verslag'}
              </button>
            </div>

            {/* Recent Reports */}
            {n8nStatus.reports && n8nStatus.reports.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">🕒 Recente Verslagen</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {n8nStatus.reports.slice(0, 3).map((report, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                      <span className="text-gray-600">
                        {new Date(report.created_at).toLocaleString('nl-NL')}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        report.status === 'completed' ? 'bg-green-100 text-green-700' :
                        report.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Operations Status */}
            {(n8nStatus.lastExport || n8nStatus.lastReport) && (
              <div className="mt-4 text-xs text-gray-500">
                {n8nStatus.lastExport && (
                  <p>✅ Laatste export: {n8nStatus.lastExport.timestamp?.toLocaleTimeString('nl-NL')}</p>
                )}
                {n8nStatus.lastReport && (
                  <p>📋 Laatste verslag: {n8nStatus.lastReport.timestamp?.toLocaleTimeString('nl-NL')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPanel;