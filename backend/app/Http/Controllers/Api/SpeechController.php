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
     * Process audio and return transcription
     */
    public function transcribe(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'audio' => 'required|file|mimes:wav,mp3,webm,m4a|max:10240', // Max 10MB
            ]);

            $audioFile = $request->file('audio');
            $speechKey = config('conversation.azure_speech.key');
            $speechRegion = config('conversation.azure_speech.region');

            if (!$speechKey || !$speechRegion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Azure Speech Service niet geconfigureerd'
                ], 500);
            }

            // Prepare Azure Speech API request
            $endpoint = "https://{$speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1";
            
            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $speechKey,
                'Content-Type' => 'audio/wav; codecs=audio/pcm; samplerate=16000',
                'Accept' => 'application/json',
            ])
            ->withOptions([
                'query' => [
                    'language' => 'nl-NL',
                    'format' => 'detailed',
                    'profanityFilterMode' => 'Masked',
                ],
            ])
            ->withBody(file_get_contents($audioFile->getPathname()), 'audio/wav')
            ->post($endpoint);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['DisplayText']) && !empty($result['DisplayText'])) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'text' => $result['DisplayText'],
                            'confidence' => $result['Confidence'] ?? 0.8,
                            'duration' => $result['Duration'] ?? 0,
                            'offset' => $result['Offset'] ?? 0,
                        ]
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Geen spraak gedetecteerd in audio'
                    ]);
                }
            } else {
                Log::error('Azure Speech API Error: ' . $response->body());
                return response()->json([
                    'success' => false,
                    'message' => 'Fout bij transcriptie verwerking'
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