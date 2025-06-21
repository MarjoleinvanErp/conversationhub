import React, { useState } from 'react';
import { Download, Send, FileText, CheckCircle, AlertCircle } from './Icons.jsx';

const ReportPanel = ({ 
  meetingId, 
  meeting, 
  recordingTime, 
  isRefreshing = false,
  reportData,
  setReportData 
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownloadRawData = async () => {
    if (!meetingId) {
      alert('Meeting ID niet beschikbaar');
      return;
    }

    // Simple mock implementation for now
    const mockData = {
      meeting: {
        id: meetingId,
        title: meeting?.title || 'Onbekend',
        status: meeting?.status || 'onbekend',
        participants: meeting?.participants || []
      },
      exported_at: new Date().toISOString()
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${meetingId}-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleN8NTrigger = async () => {
    if (!meetingId) {
      alert('Meeting ID niet beschikbaar');
      return;
    }

    setLoading(true);
    
    try {
      // Check auth token
      const token = localStorage.getItem('auth_token') || '';
      console.log('🔑 Using auth token:', token ? 'Token found' : 'No token');
      
      const url = `/api/n8n/trigger-meeting-completed/${meetingId}`;
      console.log('🚀 Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ N8N Response:', result);
      
      if (result.success) {
        alert('Meeting data succesvol verzonden naar N8N!');
        if (setReportData) {
          setReportData({
            hasReport: true,
            summary: 'Verslag wordt gegenereerd...'
          });
        }
      } else {
        alert('Fout bij versturen naar N8N: ' + (result.error || result.message || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('❌ N8N trigger error:', error);
      
      // More specific error messages
      if (error.message.includes('Failed to fetch')) {
        alert('Netwerkfout: Kan geen verbinding maken met de server. Check of de backend draait.');
      } else if (error.message.includes('401')) {
        alert('Autorisatie fout: Je bent mogelijk niet ingelogd. Probeer opnieuw in te loggen.');
      } else if (error.message.includes('404')) {
        alert('Endpoint niet gevonden: De N8N route bestaat niet op de server.');
      } else {
        alert('Fout bij versturen naar N8N: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${isRefreshing ? 'opacity-60' : ''}`}>
      {/* Meeting Statistics */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">📊 Gesprek Statistieken</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Duur:</span>
            <div className="font-medium">
              {formatTime(recordingTime || (meeting?.duration ? meeting.duration * 60 : 0))}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <div className="font-medium capitalize">{meeting?.status || 'Onbekend'}</div>
          </div>
          <div>
            <span className="text-gray-500">Deelnemers:</span>
            <div className="font-medium">{meeting?.participants?.length || 0}</div>
          </div>
          <div>
            <span className="text-gray-500">Verslag:</span>
            <div className="font-medium flex items-center text-gray-500">
              <AlertCircle className="w-3 h-3 mr-1" />
              Nog niet beschikbaar
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="border-t pt-4">
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

          {/* Generate Report via N8N */}
          <button 
            className={`w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm ${
              (isRefreshing || loading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleN8NTrigger}
            disabled={isRefreshing || loading}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Versturen...' : 'Genereer Verslag (N8N)'}
          </button>

          {/* Basic Report - Placeholder */}
          <button 
            className={`w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center text-sm ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => alert('Basis verslag functie wordt nog geïmplementeerd')}
            disabled={isRefreshing}
          >
            <FileText className="w-4 h-4 mr-2" />
            Genereer Basis Verslag
          </button>

        </div>

        {/* Status Messages */}
        {loading && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            Bezig met verwerken...
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPanel;