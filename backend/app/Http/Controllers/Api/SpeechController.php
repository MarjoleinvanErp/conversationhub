<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AzureWhisperService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SpeechController extends Controller
{
    private $azureWhisperService;

    public function __construct(AzureWhisperService $azureWhisperService)
    {
        $this->azureWhisperService = $azureWhisperService;
    }

    /**
     * Process audio and return transcription
     */
    public function transcribe(Request $request): JsonResponse
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'audio' => 'required|file|mimes:wav,mp3,webm,m4a,ogg,flac|max:25600', // 25MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ongeldige audio file',
                    'errors' => $validator->errors()
                ], 422);
            }

            $audioFile = $request->file('audio');

            // Log request
            Log::info('Audio transcription request', [
                'user_id' => $request->user()->id,
                'file_size' => $audioFile->getSize(),
                'file_type' => $audioFile->getMimeType(),
                'original_name' => $audioFile->getClientOriginalName(),
            ]);

            // Check service configuration
            if (!$this->azureWhisperService->isConfigured()) {
                $configStatus = $this->azureWhisperService->getConfigurationStatus();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Azure Whisper service niet geconfigureerd',
                    'configuration_status' => $configStatus,
                    'help' => 'Controleer AZURE_WHISPER_ENDPOINT en AZURE_WHISPER_KEY in .env'
                ], 500);
            }

            // Transcribe
            $result = $this->azureWhisperService->transcribeAudio($audioFile);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'text' => $result['text'],
                        'language' => $result['language'],
                        'duration' => $result['duration'],
                        'confidence' => $result['confidence'] ?? 0.8,
                        'segments_count' => count($result['segments'] ?? []),
                        'words_count' => count($result['words'] ?? []),
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Transcriptie mislukt: ' . $result['error'],
                    'error_details' => [
                        'status_code' => $result['status_code'] ?? null,
                    ]
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Transcription controller error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Fout bij transcriptie: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test Azure Whisper connection and configuration
     */
    public function test(Request $request): JsonResponse
    {
        try {
            $configStatus = $this->azureWhisperService->getConfigurationStatus();
            $configured = $this->azureWhisperService->isConfigured();
            
            $response = [
                'success' => $configured,
                'message' => $configured ? 
                    'Azure Whisper geconfigureerd en klaar voor gebruik' : 
                    'Azure Whisper niet volledig geconfigureerd',
                'configuration_status' => $configStatus,
                'environment_check' => [
                    'AZURE_WHISPER_ENDPOINT' => env('AZURE_WHISPER_ENDPOINT') ? 'Set (' . substr(env('AZURE_WHISPER_ENDPOINT'), 0, 30) . '...)' : 'Missing',
                    'AZURE_WHISPER_KEY' => env('AZURE_WHISPER_KEY') ? 'Set (' . strlen(env('AZURE_WHISPER_KEY')) . ' chars)' : 'Missing',
                    'AZURE_WHISPER_MODEL' => env('AZURE_WHISPER_MODEL', 'Whisper'),
                    'AZURE_WHISPER_LANGUAGE' => env('AZURE_WHISPER_LANGUAGE', 'nl-NL'),
                    'AZURE_WHISPER_REGION' => env('AZURE_WHISPER_REGION', 'westeurope'),
                ],
                'next_steps' => $configured ? [
                    'Service is ready for transcription requests',
                    'Test with a small audio file via /api/speech/transcribe'
                ] : [
                    'Check AZURE_WHISPER_ENDPOINT in .env file',
                    'Check AZURE_WHISPER_KEY in .env file', 
                    'Check AZURE_WHISPER_MODEL in .env file',
                    'Restart Docker containers after updating .env'
                ]
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij testen configuratie: ' . $e->getMessage(),
            ], 500);
        }
    }
}