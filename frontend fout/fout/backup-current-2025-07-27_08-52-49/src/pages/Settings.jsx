import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Shield, 
  Database,
  Zap,
  Activity,
  Settings as SettingsIcon,
  TestTube
} from 'lucide-react';
import configService from '../services/configService';
import enhancedLiveTranscriptionService from '../services/enhancedLiveTranscriptionService';

const Settings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({});
  const [testingServices, setTestingServices] = useState(false);

  useEffect(() => {
    loadConfig();
    testServices();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await configService.getAllConfig();
      setConfig(configData);
      setError(null);
    } catch (err) {
      setError('Failed to load configuration');
      console.error('Config load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testServices = async () => {
    try {
      setTestingServices(true);
      const results = await enhancedLiveTranscriptionService.testServices();
      setServiceStatus(results);
    } catch (err) {
      console.error('Service test error:', err);
    } finally {
      setTestingServices(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (enabled) => {
    return enabled ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getServiceStatusIcon = (service) => {
    const status = serviceStatus[service];
    if (!status) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    
    return status.available ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
            <p className="text-gray-600">ConversationHub configuratie</p>
          </div>
        </div>
        
        <button
          onClick={testServices}
          disabled={testingServices}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <TestTube className="w-4 h-4" />
          <span>{testingServices ? 'Testen...' : 'Test Services'}</span>
        </button>
      </div>

      {/* Live Transcriptie Instellingen */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Mic className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Live Transcriptie</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Browser Speech Recognition */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Browser Spraakherkenning</h3>
              <div className={`w-3 h-3 rounded-full ${config?.transcription?.live_webspeech_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Real-time transcriptie via browser</p>
            <div className="flex items-center">
              {getStatusIcon(config?.transcription?.live_webspeech_enabled)}
              <span className={`text-sm font-medium ml-2 ${
                config?.transcription?.live_webspeech_enabled ? 'text-green-700' : 'text-red-700'
              }`}>
                {config?.transcription?.live_webspeech_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
              </span>
            </div>
          </div>

          {/* Whisper */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Whisper AI</h3>
              <div className={`w-3 h-3 rounded-full ${config?.transcription?.whisper_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">AI-powered transcriptie service</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(config?.transcription?.whisper_enabled)}
                <span className={`text-sm font-medium ml-2 ${
                  config?.transcription?.whisper_enabled ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config?.transcription?.whisper_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {getServiceStatusIcon('whisper')}
                <span className="text-xs text-gray-500">
                  {serviceStatus.whisper?.status || 'Onbekend'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Chunk interval: {config?.transcription?.whisper_chunk_duration || 90}s
            </div>
          </div>
        </div>
      </div>

      {/* N8N Integratie Instellingen */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Zap className="w-6 h-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">N8N Integratie</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* N8N Transcriptie */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">N8N Transcriptie</h3>
              <div className={`w-3 h-3 rounded-full ${config?.n8n?.transcription_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Transcriptie via N8N workflow</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(config?.n8n?.transcription_enabled)}
                <span className={`text-sm font-medium ml-2 ${
                  config?.n8n?.transcription_enabled ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config?.n8n?.transcription_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {getServiceStatusIcon('n8n')}
                <span className="text-xs text-gray-500">
                  {serviceStatus.n8n?.success ? 'Verbonden' : 'Niet verbonden'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Webhook: {config?.n8n?.webhook_url ? 'Geconfigureerd' : 'Niet geconfigureerd'}
            </div>
          </div>

          {/* Automatische Export */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Automatische Export</h3>
              <div className={`w-3 h-3 rounded-full ${config?.n8n?.auto_export_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Gesprekken automatisch naar N8N sturen</p>
            <div className="flex items-center">
              {getStatusIcon(config?.n8n?.auto_export_enabled)}
              <span className={`text-sm font-medium ml-2 ${
                config?.n8n?.auto_export_enabled ? 'text-green-700' : 'text-red-700'
              }`}>
                {config?.n8n?.auto_export_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Interval: {config?.n8n?.auto_export_interval_minutes || 10} minuten
            </div>
          </div>
        </div>

        {/* N8N Service Status Detail */}
        {serviceStatus.n8n && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">N8N Service Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verbinding:</span>
                <span className={`text-sm font-medium ${
                  serviceStatus.n8n.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {serviceStatus.n8n.success ? 'Succesvol' : 'Gefaald'}
                </span>
              </div>
              {serviceStatus.n8n.response_time && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response tijd:</span>
                  <span className="text-sm text-gray-700">{serviceStatus.n8n.response_time}ms</span>
                </div>
              )}
              {serviceStatus.n8n.error && (
                <div className="text-sm text-red-600 mt-2">
                  Fout: {serviceStatus.n8n.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transcriptie Service Prioriteit */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Activity className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Service Prioriteit</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Standaard transcriptie service: <strong className="capitalize">{config?.transcription?.default_transcription_service || 'auto'}</strong>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['auto', 'whisper', 'n8n'].map((service) => (
              <div key={service} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {service === 'auto' && <Activity className="w-5 h-5 text-blue-600" />}
                  {service === 'whisper' && <Mic className="w-5 h-5 text-blue-600" />}
                  {service === 'n8n' && <Zap className="w-5 h-5 text-purple-600" />}
                  <h3 className="font-medium text-gray-700 capitalize">{service}</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {service === 'auto' && 'Automatisch beste service kiezen'}
                  {service === 'whisper' && 'Azure Whisper AI service'}
                  {service === 'n8n' && 'N8N workflow met speaker diarization'}
                </p>
                <div className="mt-2 flex items-center">
                  {getServiceStatusIcon(service === 'auto' ? 'whisper' : service)}
                  <span className="text-xs text-gray-500 ml-1">
                    {service === 'auto' ? 'Beschikbaar' : 
                     serviceStatus[service]?.available ? 'Beschikbaar' : 'Niet beschikbaar'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Instellingen */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Shield className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Beveiliging</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Privacy Filter</h3>
              <div className={`w-3 h-3 rounded-full ${config?.privacy?.filter_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Automatisch filteren van gevoelige data</p>
            <div className="flex items-center">
              {getStatusIcon(config?.privacy?.filter_enabled)}
              <span className={`text-sm font-medium ml-2 ${
                config?.privacy?.filter_enabled ? 'text-green-700' : 'text-red-700'
              }`}>
                {config?.privacy?.filter_enabled ? 'Actief' : 'Uitgeschakeld'}
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Data Retentie</h3>
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-3">Automatisch verwijderen van oude data</p>
            <div className="text-sm text-gray-700">
              <strong>{config?.privacy?.data_retention_days || 90}</strong> dagen bewaren
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Audio Verwijdering</h3>
              <div className={`w-3 h-3 rounded-full ${config?.privacy?.auto_delete_audio ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Audio bestanden automatisch verwijderen</p>
            <div className="flex items-center">
              {getStatusIcon(config?.privacy?.auto_delete_audio)}
              <span className={`text-sm font-medium ml-2 ${
                config?.privacy?.auto_delete_audio ? 'text-green-700' : 'text-red-700'
              }`}>
                {config?.privacy?.auto_delete_audio ? 'Ingeschakeld' : 'Uitgeschakeld'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
          </div>
          <div className="text-sm text-gray-500">
            Laatst gecontroleerd: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Browser API's</span>
              {getStatusIcon(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices)}
            </div>
            <div className="text-xs text-gray-500">
              MediaDevices, SpeechRecognition
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Whisper Service</span>
              {getServiceStatusIcon('whisper')}
            </div>
            <div className="text-xs text-gray-500">
              {serviceStatus.whisper?.status || 'Onbekend'}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">N8N Service</span>
              {getServiceStatusIcon('n8n')}
            </div>
            <div className="text-xs text-gray-500">
              {serviceStatus.n8n?.success ? 'Verbonden' : 'Niet verbonden'}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Configuration</span>
              {getStatusIcon(config !== null)}
            </div>
            <div className="text-xs text-gray-500">
              {config ? 'Geladen' : 'Niet beschikbaar'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;