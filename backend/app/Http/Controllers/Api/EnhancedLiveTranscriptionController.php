<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnhancedLiveTranscriptionService;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class EnhancedLiveTranscriptionController extends Controller
{
    private $transcriptionService;

    public function __construct(EnhancedLiveTranscriptionService $transcriptionService)
    {
        $this->transcriptionService = $transcriptionService;
    }

    /**
     * Process live transcription with service selection
     */
    public function processLiveTranscription(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'audio_data' => 'required|string',
                'session_id' => 'required|string',
                'preferred_service' => 'sometimes|string|in:auto,whisper,n8n',
                'use_n8n' => 'sometimes|boolean'
            ]);

            $audioData = base64_decode($request->input('audio_data'));
            $sessionId = $request->input('session_id');
            
            $options = [
                'preferred_service' => $request->input('preferred_service', 'auto'),
                'use_n8n' => $request->input('use_n8n', false)
            ];

            Log::info('Live transcription request received', [
                'session_id' => $sessionId,
                'audio_size' => strlen($audioData),
                'preferred_service' => $options['preferred_service'],
                'use_n8n' => $options['use_n8n']
            ]);

            $result = $this->transcriptionService->processLiveTranscription(
                $audioData,
                $sessionId,
                $options
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'transcription' => $result['transcription'],
                        'transcriptions' => $result['transcriptions'] ?? [$result['transcription']],
                        'primary_source' => $result['primary_source'],
                        'session_stats' => $result['session_stats'],
                        'processing_details' => $result['processing_details'] ?? []
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                    'session_stats' => $result['session_stats'] ?? []
                ], 422);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Live transcription validation failed', [
                'errors' => $e->errors()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Live transcription controller error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get transcription configuration including N8N status
     */
    public function getConfig(): JsonResponse
    {
        try {
            $config = $this->transcriptionService->getTranscriptionConfig();
            
            return response()->json([
                'success' => true,
                'data' => $config
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get transcription config', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get configuration'
            ], 500);
        }
    }

    /**
     * Test available transcription services
     */
    public function testServices(): JsonResponse
    {
        try {
            $results = $this->transcriptionService->testServices();
            
            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to test transcription services', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to test services'
            ], 500);
        }
    }

    /**
     * Set preferred transcription service for session
     */
    public function setPreferredService(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'session_id' => 'required|string',
                'service' => 'required|string|in:auto,whisper,n8n'
            ]);

            $sessionId = $request->input('session_id');
            $service = $request->input('service');

            $this->transcriptionService->setPreferredService($sessionId, $service);

            return response()->json([
                'success' => true,
                'data' => [
                    'session_id' => $sessionId,
                    'preferred_service' => $service
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to set preferred service', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to set preferred service'
            ], 500);
        }
    }

    /**
     * Get preferred transcription service for session
     */
    public function getPreferredService(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'session_id' => 'required|string'
            ]);

            $sessionId = $request->input('session_id');
            $preferredService = $this->transcriptionService->getPreferredService($sessionId);

            return response()->json([
                'success' => true,
                'data' => [
                    'session_id' => $sessionId,
                    'preferred_service' => $preferredService
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to get preferred service', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get preferred service'
            ], 500);
        }
    }
}