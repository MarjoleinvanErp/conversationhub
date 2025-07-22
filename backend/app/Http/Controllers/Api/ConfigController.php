<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ConfigController extends Controller
{
    /**
     * Get application configuration
     */
    public function getConfig(): JsonResponse
    {
        try {
            Log::info('Config endpoint called');

            $config = [
                'transcription' => [
                    'live_webspeech_enabled' => filter_var(env('TRANSCRIPTION_LIVE_WEBSPEECH_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
                    'whisper_enabled' => filter_var(env('TRANSCRIPTION_WHISPER_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
                    'whisper_chunk_duration' => (int) env('TRANSCRIPTION_WHISPER_CHUNK_DURATION', 90),
                    'n8n_transcription_enabled' => filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
                    'default_transcription_service' => env('DEFAULT_TRANSCRIPTION_SERVICE', 'auto'),
                    'available_services' => [
                        'whisper' => !empty(env('AZURE_WHISPER_KEY')),
                        'n8n' => !empty(env('N8N_TRANSCRIPTION_WEBHOOK_URL'))
                    ]
                ],
                'n8n' => [
                    'auto_export_enabled' => filter_var(env('N8N_AUTO_EXPORT_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
                    'auto_export_interval_minutes' => (int) env('N8N_AUTO_EXPORT_INTERVAL_MINUTES', 10),
                    'webhook_url' => env('N8N_WEBHOOK_URL'),
                    'api_key' => env('N8N_API_KEY'),
                    'transcription_enabled' => filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
                    'transcription_webhook_url' => env('N8N_TRANSCRIPTION_WEBHOOK_URL'),
                    'timeout_seconds' => 60
                ],
                'privacy' => [
                    'filter_enabled' => filter_var(env('PRIVACY_FILTER_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
                    'data_retention_days' => (int) env('DATA_RETENTION_DAYS', 90),
                    'auto_delete_audio' => filter_var(env('AUTO_DELETE_AUDIO', true), FILTER_VALIDATE_BOOLEAN)
                ],
                'azure' => [
                    'whisper_configured' => !empty(env('AZURE_WHISPER_KEY')) && !empty(env('AZURE_WHISPER_ENDPOINT'))
                ]
            ];

            Log::info('Config loaded successfully', [
                'whisper_enabled' => $config['transcription']['whisper_enabled'],
                'webspeech_enabled' => $config['transcription']['live_webspeech_enabled'],
                'azure_configured' => $config['azure']['whisper_configured']
            ]);

            return response()->json([
                'success' => true,
                'data' => $config
            ]);

        } catch (\Exception $e) {
            Log::error('Config loading failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to load configuration: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get public configuration (for backwards compatibility)
     */
    public function publicConfig(): JsonResponse
    {
        return $this->getConfig();
    }

    /**
     * Get transcription configuration (for backwards compatibility)
     */
    public function transcription(): JsonResponse
    {
        try {
            $config = $this->getConfig();
            $data = $config->getData(true);
            
            if ($data['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $data['data']['transcription']
                ]);
            }
            
            return $config;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load transcription config'
            ], 500);
        }
    }

    /**
     * Get N8N configuration (for backwards compatibility)
     */
    public function n8n(): JsonResponse
    {
        try {
            $config = $this->getConfig();
            $data = $config->getData(true);
            
            if ($data['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $data['data']['n8n']
                ]);
            }
            
            return $config;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load N8N config'
            ], 500);
        }
    }
}