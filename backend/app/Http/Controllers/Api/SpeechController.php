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
                'audio' => 'required|file|mimes:wav,mp3,webm,m4a,ogg|max:25600', // 25MB max
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
            ]);

            // Check service
            if (!$this->azureWhisperService->isConfigured()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Azure Whisper service niet geconfigureerd'
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
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Transcriptie mislukt: ' . $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Transcription error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Fout bij transcriptie: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test Azure connection
     */
    public function test(Request $request): JsonResponse
    {
        $configured = $this->azureWhisperService->isConfigured();
        
        return response()->json([
            'success' => $configured,
            'message' => $configured ? 'Azure Whisper geconfigureerd' : 'Azure Whisper niet geconfigureerd',
            'endpoint_set' => !empty(config('conversation.azure_whisper.endpoint')),
            'key_set' => !empty(config('conversation.azure_whisper.key')),
        ]);
    }
}