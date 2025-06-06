<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SpeechController extends Controller
{
/**
     * Process audio and return transcription using Azure Whisper
     */
    public function transcribe(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'audio' => 'required|file|mimes:wav,mp3,webm,m4a,ogg,flac|max:25600', // Max 25MB
            ]);

            $audioFile = $request->file('audio');
            $whisperEndpoint = config('conversation.azure_whisper.endpoint');
            $whisperKey = config('conversation.azure_whisper.key');
            $whisperModel = config('conversation.azure_whisper.model', 'whisper');

            if (!$whisperEndpoint || !$whisperKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Azure Whisper Service niet geconfigureerd'
                ], 500);
            }

            // Build correct Azure OpenAI Whisper endpoint
            $endpoint = rtrim($whisperEndpoint, '/') . '/openai/deployments/' . $whisperModel . '/audio/transcriptions?api-version=2024-06-01';
            
            Log::info('Azure Whisper Request', [
                'endpoint' => $endpoint,
                'file_size' => $audioFile->getSize(),
                'file_type' => $audioFile->getMimeType(),
                'model' => $whisperModel
            ]);

 // Save uploaded file for debugging
            $debugFileName = 'debug_' . time() . '_' . $audioFile->getClientOriginalName();
            $savedPath = $audioFile->storeAs('audio', $debugFileName);
            
            Log::info('Audio file saved for debugging', [
                'saved_path' => $savedPath,
                'full_path' => storage_path('app/' . $savedPath),
                'original_name' => $audioFile->getClientOriginalName(),
                'file_size' => $audioFile->getSize(),
            ]);

            // Read file contents
            $fileContents = file_get_contents($audioFile->getPathname());
            $fileName = $audioFile->getClientOriginalName();

            $response = Http::withHeaders([
                'api-key' => $whisperKey,
            ])
            ->asMultipart()
            ->attach(
                'file', 
                $fileContents, 
                $fileName
            )
            ->post($endpoint, [
                'model' => $whisperModel,
                'language' => 'nl',
                'response_format' => 'json',
            ]);

            Log::info('Azure Whisper Response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['text']) && !empty($result['text'])) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'text' => $result['text'],
                            'language' => $result['language'] ?? 'nl',
                            'duration' => $result['duration'] ?? 0,
                        ]
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Geen spraak gedetecteerd in audio'
                    ]);
                }
            } else {
                Log::error('Azure Whisper API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Azure API fout: ' . $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Speech transcription error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Fout bij audio verwerking: ' . $e->getMessage()
            ], 500);
        }
    }
}