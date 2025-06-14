import React from 'react';
import { FileText, Download, Send, ChevronUp, ChevronDown } from './Icons.jsx';

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
  // NEW: Refresh props
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Panel Header met Refresh Button */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggle}
        >
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">📋 Verslag</h3>
          {reportData.hasReport && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Beschikbaar
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
                : 'bg-white text-purple-600 hover:bg-purple-50 border-purple-200 shadow-sm'
            }`}
            title="Vernieuw rapport gegevens"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
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

          {/* Expand/Collapse Button */}
          <button
            onClick={onToggle}
            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
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
        <div className="p-4">
          {/* Refresh Status Indicator */}
          {isRefreshing && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-purple-800">Rapport gegevens worden vernieuwd...</span>
              </div>
            </div>
          )}

          {reportData.hasReport ? (
            <div className={`space-y-4 ${isRefreshing ? 'opacity-60' : ''}`}>
              {/* Report Summary */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">📝 Samenvatting</h4>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">{reportData.summary}</p>
                </div>
              </div>

              {/* Key Points */}
              {reportData.keyPoints && reportData.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">🎯 Belangrijke Punten</h4>
                  <ul className="space-y-1">
                    {reportData.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {reportData.actionItems && reportData.actionItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">✅ Actiepunten</h4>
                  <ul className="space-y-1">
                    {reportData.actionItems.map((action, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2">▶</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {reportData.nextSteps && reportData.nextSteps.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">➡️ Vervolgstappen</h4>
                  <ul className="space-y-1">
                    {reportData.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-blue-500 mr-2">→</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Export Actions for Generated Report */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">📤 Export Verslag</h4>
                <div className="space-y-2">
                  <button 
                    className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isRefreshing) {
                        alert('Download verslag functionaliteit wordt nog geïmplementeerd');
                      }
                    }}
                    disabled={isRefreshing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Verslag PDF
                  </button>
                  <button 
                    className={`w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isRefreshing) {
                        alert('N8N export functionaliteit wordt nog geïmplementeerd');
                      }
                    }}
                    disabled={isRefreshing}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Verstuur naar N8N
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`space-y-4 ${isRefreshing ? 'opacity-60' : ''}`}>
              {/* Meeting Statistics */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">📊 Gesprek Statistieken</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Duur:</span>
                    <div className="font-medium">{formatTime ? formatTime(recordingTime) : '00:00'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Transcripties:</span>
                    <div className="font-medium">
                      {(liveTranscriptions?.length || 0) + (whisperTranscriptions?.length || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Deelnemers:</span>
                    <div className="font-medium">{meeting?.participants?.length || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Agenda items:</span>
                    <div className="font-medium">{meeting?.agenda_items?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-2">📈 Snel Overzicht</h5>
                <div className="text-sm text-gray-600">
                  <p>• {(liveTranscriptions?.length || 0)} live transcripties</p>
                  <p>• {(whisperTranscriptions?.length || 0)} Whisper transcripties</p>
                  <p>• {meeting?.participants?.length || 0} deelnemers aanwezig</p>
                  <p>• {recordingTime ? Math.floor(recordingTime / 60) : 0} minuten opgenomen</p>
                </div>
              </div>

              {/* Export Actions */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">📤 Export Opties</h4>
                <div className="space-y-2">
                  <button 
                    className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isRefreshing) {
                        alert('Download verslag functionaliteit wordt nog geïmplementeerd');
                      }
                    }}
                    disabled={isRefreshing}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Ruwe Data
                  </button>
                  <button 
                    className={`w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isRefreshing) {
                        alert('N8N export functionaliteit wordt nog geïmplementeerd');
                      }
                    }}
                    disabled={isRefreshing}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Verstuur naar N8N
                  </button>
                  <button 
                    className={`w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (!isRefreshing) {
                        // Simulate report generation
                        if (setReportData) {
                          setReportData({
                            hasReport: true,
                            summary: 'Dit gesprek ging over de voortgang van de werkzoekende. Er zijn concrete vervolgstappen afgesproken.',
                            keyPoints: [
                              'Sollicitaties zijn verstuurd naar 3 bedrijven',
                              'Gesprek gepland voor volgende week',
                              'CV moet worden bijgewerkt'
                            ],
                            actionItems: [
                              'CV bijwerken voor vrijdag',
                              'Voorbereiding gesprek bij Bedrijf X',
                              'Netwerk uitbreiden via LinkedIn'
                            ],
                            nextSteps: [
                              'Volgende afspraak inplannen over 2 weken',
                              'Feedback verwerken na sollicitatiegesprek',
                              'Nieuwe vacatures zoeken in IT sector'
                            ]
                          });
                        }
                      }
                    }}
                    disabled={isRefreshing}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Genereer Verslag
                  </button>
                </div>
              </div>

              {/* Last Update Info */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Laatste update:</span>
                  <span>{new Date().toLocaleTimeString('nl-NL')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading skeleton when refreshing */}
          {isRefreshing && (
            <div className="space-y-3 animate-pulse mt-4">
              <div className="h-4 bg-purple-200 rounded w-3/4"></div>
              <div className="h-4 bg-purple-200 rounded w-1/2"></div>
              <div className="h-4 bg-purple-200 rounded w-2/3"></div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="h-8 bg-purple-200 rounded"></div>
                <div className="h-8 bg-purple-200 rounded"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportPanel;