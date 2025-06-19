import React, { useState, useEffect } from 'react';
import { Settings, Mic, Volume2, Send, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import configService from '../services/configService';

const SettingsPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const configData = await configService.fetchConfig();
      setConfig(configData);
    } catch (err) {
      setError('Fout bij laden configuratie');
      console.error('Config load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    configService.clearCache();
    await loadConfig();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-3" />
              <span>Configuratie laden...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center text-red-600 mb-4">
              <AlertCircle className="w-6 h-6 mr-3" />
              <span className="text-lg font-semibold">Fout</span>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button 
              onClick={loadConfig}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
                <p className="text-gray-600">ConversationHub configuratie</p>
              </div>
            </div>
            <button 
              onClick={refreshConfig}
              className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Ververs
            </button>
          </div>
        </div>

        {/* Transcriptie Instellingen */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Mic className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Transcriptie</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Live WebSpeech</h3>
                <div className={`w-3 h-3 rounded-full ${config?.transcription?.live_webspeech_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Browser spraakherkenning</p>
              <div className="flex items-center">
                {config?.transcription?.live_webspeech_enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${
                  config?.transcription?.live_webspeech_enabled ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config?.transcription?.live_webspeech_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Whisper Transcriptie</h3>
                <div className={`w-3 h-3 rounded-full ${config?.transcription?.whisper_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Azure OpenAI Whisper</p>
              <div className="flex items-center">
                {config?.transcription?.whisper_enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${
                  config?.transcription?.whisper_enabled ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config?.transcription?.whisper_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Chunk Duur</h3>
                <span className="text-lg font-bold text-blue-600">
                  {config?.transcription?.whisper_chunk_duration || 90}s
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Whisper verwerking interval</p>
              <div className="text-sm text-gray-500">
                Audio wordt elke {config?.transcription?.whisper_chunk_duration || 90} seconden verwerkt
              </div>
            </div>
          </div>
        </div>

        {/* N8N Instellingen */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Send className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">N8N Integratie</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Automatische Export</h3>
                <div className={`w-3 h-3 rounded-full ${config?.n8n?.auto_export_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Gesprekken automatisch naar N8N sturen</p>
              <div className="flex items-center">
                {config?.n8n?.auto_export_enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${
                  config?.n8n?.auto_export_enabled ? 'text-green-700' : 'text-red-700'
                }`}>
                  {config?.n8n?.auto_export_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">Export Interval</h3>
                <span className="text-lg font-bold text-purple-600">
                  {config?.n8n?.auto_export_interval_minutes || 10}min
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Hoe vaak gesprekken worden geëxporteerd</p>
              <div className="text-sm text-gray-500">
                {config?.n8n?.auto_export_enabled 
                  ? `Export elke ${config?.n8n?.auto_export_interval_minutes || 10} minuten`
                  : 'Geen automatische export'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Azure Status */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Volume2 className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Azure OpenAI</h2>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Whisper Configuratie</h3>
              <div className={`w-3 h-3 rounded-full ${config?.azure?.whisper_configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <p className="text-sm text-gray-600 mb-3">Azure OpenAI Whisper API status</p>
            <div className="flex items-center">
              {config?.azure?.whisper_configured ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                config?.azure?.whisper_configured ? 'text-green-700' : 'text-red-700'
              }`}>
                {config?.azure?.whisper_configured ? 'Geconfigureerd' : 'Niet geconfigureerd'}
              </span>
            </div>
            {!config?.azure?.whisper_configured && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Configureer AZURE_WHISPER_ENDPOINT en AZURE_WHISPER_KEY in .env bestand
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Configuratie bewerken</h3>
              <p className="text-sm text-blue-800 mb-2">
                Deze instellingen worden gelezen uit het .env bestand van de backend. 
                Om instellingen te wijzigen:
              </p>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Bewerk het backend/.env bestand</li>
                <li>Herstart de backend container</li>
                <li>Klik op "Ververs" om de nieuwe configuratie te laden</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;