<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConfigService;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    /**
     * Get all configuration for frontend
     */
    public function index(): JsonResponse
    {
        try {
            $config = ConfigService::getAllConfig();
            
            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'Configuratie opgehaald'
            ]);
        } catch (\Exception $e) {
            \Log::error('Config index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen configuratie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transcription configuration
     */
    public function transcription(): JsonResponse
    {
        try {
            $config = ConfigService::getTranscriptionConfig();
            
            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'Transcriptie configuratie opgehaald'
            ]);
        } catch (\Exception $e) {
            \Log::error('Config transcription error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen transcriptie configuratie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get N8N configuration
     */
    public function n8n(): JsonResponse
    {
        try {
            $config = ConfigService::getN8NConfig();
            
            // Remove sensitive data for frontend
            unset($config['api_key']);
            
            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'N8N configuratie opgehaald'
            ]);
        } catch (\Exception $e) {
            \Log::error('Config n8n error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen N8N configuratie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get public configuration (no authentication required)
     * Only safe, non-sensitive configuration values
     */
    public function publicConfig(): JsonResponse
    {
        try {
            $config = [
                'transcription' => ConfigService::getTranscriptionConfig(),
                'n8n' => [
                    'auto_export_enabled' => ConfigService::isN8NAutoExportEnabled(),
                    'auto_export_interval_minutes' => ConfigService::getN8NAutoExportInterval(),
                    // Geen sensitive data zoals API keys
                ],
                'azure' => [
                    'whisper_configured' => !empty(env('AZURE_WHISPER_ENDPOINT')) && !empty(env('AZURE_WHISPER_KEY')),
                ],
                'app' => [
                    'name' => env('APP_NAME', 'ConversationHub'),
                    'version' => '1.0.0',
                ],
            ];
            
            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'Publieke configuratie opgehaald'
            ]);
        } catch (\Exception $e) {
            \Log::error('Config publicConfig error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen publieke configuratie',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}