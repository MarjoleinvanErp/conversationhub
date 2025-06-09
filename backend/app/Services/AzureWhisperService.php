<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class AzureWhisperService
{
    private $endpoint;
    private $apiKey;
    private $model;
    private $region;
    private $language;
    private $timeout;

    public function __construct()
    {
        $this->endpoint = config('conversation.azure_whisper.endpoint');
        $this->apiKey = config('conversation.azure_whisper.key');
        $this->model = config('conversation.azure_whisper.model', 'Whisper');
        $this->region = config('conversation.azure_whisper.region', 'westeurope');
        $this->language = config('conversation.azure_whisper.language', 'nl-NL');
        $this->timeout = config('conversation.azure_whisper.timeout', 30);
    }

    /**
     * Transcribe audio file using Azure OpenAI Whisper
     */
    public function transcribeAudio(UploadedFile $audioFile): array
    {
        try {
            // Check configuration
            if (!$this->isConfigured()) {
                return [
                    'success' => false,
                    'error' => 'Azure Whisper niet geconfigureerd. Controleer AZURE_WHISPER_ENDPOINT en AZURE_WHISPER_KEY in .env'
                ];
            }

            // Validate file
            $validation = $this->validateAudioFile($audioFile);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'error' => $validation['error']
                ];
            }

            // Build endpoint URL voor Azure OpenAI
            $url = rtrim($this->endpoint, '/') . 
                   '/openai/deployments/' . $this->model . 
                   '/audio/transcriptions?api-version=2024-06-01';

            Log::info('Azure Whisper transcription request', [
                'url' => $url,
                'model' => $this->model,
                'file_size' => $audioFile->getSize(),
                'file_type' => $audioFile->getMimeType(),
                'original_name' => $audioFile->getClientOriginalName(),
                'language' => $this->language,
            ]);

            // Read file content
            $fileContent = file_get_contents($audioFile->getPathname());
            $fileName = $audioFile->getClientOriginalName();

            // Make API call to Azure OpenAI
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'api-key' => $this->apiKey,
                ])
                ->asMultipart()
                ->attach('file', $fileContent, $fileName)
                ->post($url, [
                    'model' => $this->model,
                    'language' => $this->language,
                    'response_format' => 'verbose_json',
                    'temperature' => 0,
                    'timestamp_granularities[]' => 'segment',
                ]);

            Log::info('Azure Whisper API response', [
                'status' => $response->status(),
                'success' => $response->successful(),
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                Log::info('Azure Whisper transcription successful', [
                    'text_length' => strlen($result['text'] ?? ''),
                    'language' => $result['language'] ?? 'unknown',
                    'duration' => $result['duration'] ?? 0,
                    'segments_count' => count($result['segments'] ?? []),
                ]);
                
                return [
                    'success' => true,
                    'text' => $result['text'] ?? '',
                    'language' => $result['language'] ?? $this->language,
                    'duration' => $result['duration'] ?? 0,
                    'segments' => $result['segments'] ?? [],
                    'confidence' => $this->calculateAverageConfidence($result['segments'] ?? []),
                    'words' => $result['words'] ?? [],
                ];
            } else {
                $errorBody = $response->body();
                Log::error('Azure Whisper API error', [
                    'status' => $response->status(),
                    'body' => $errorBody,
                    'url' => $url,
                ]);
                
                $errorMessage = $this->parseApiError($response->status(), $errorBody);
                
                return [
                    'success' => false,
                    'error' => $errorMessage,
                    'status_code' => $response->status(),
                ];
            }

        } catch (\Exception $e) {
            Log::error('Azure Whisper service exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return [
                'success' => false,
                'error' => 'Service fout: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate audio file before processing - FIXED VERSION
     */
    private function validateAudioFile(UploadedFile $file): array
    {
        // Check file size (max 25MB for Azure OpenAI)
        $maxSize = 25 * 1024 * 1024; // 25MB
        if ($file->getSize() > $maxSize) {
            return [
                'valid' => false,
                'error' => 'Bestand te groot. Maximum grootte is 25MB.'
            ];
        }

        // Get the mime type and handle codec specifications
        $mimeType = $file->getMimeType();
        $baseMimeType = explode(';', $mimeType)[0]; // Remove codec info
        
        Log::info('Audio file validation', [
            'original_mime' => $mimeType,
            'base_mime' => $baseMimeType,
            'file_extension' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
        ]);

        // Check file type - now supports codec specifications
        $allowedBaseMimeTypes = [
            'audio/wav', 'audio/wave', 'audio/x-wav',
            'audio/mpeg', 'audio/mp3',
            'audio/webm', // This will now match audio/webm;codecs=opus
            'audio/mp4', 'audio/m4a',
            'audio/ogg', 'audio/vorbis',
            'audio/flac',
            'audio/x-flac',
        ];

        // Also check by file extension as fallback
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['wav', 'mp3', 'webm', 'm4a', 'ogg', 'flac', 'opus'];

        $mimeTypeValid = in_array($baseMimeType, $allowedBaseMimeTypes);
        $extensionValid = in_array($extension, $allowedExtensions);

        if (!$mimeTypeValid && !$extensionValid) {
            return [
                'valid' => false,
                'error' => 'Niet ondersteund bestandsformaat. Gebruik WAV, MP3, WebM, M4A, OGG of FLAC. (Gedetecteerd: ' . $mimeType . ', extensie: ' . $extension . ')'
            ];
        }

        Log::info('Audio file validation passed', [
            'mime_valid' => $mimeTypeValid,
            'extension_valid' => $extensionValid,
        ]);

        return ['valid' => true];
    }

    /**
     * Calculate average confidence from segments
     */
    private function calculateAverageConfidence(array $segments): float
    {
        if (empty($segments)) {
            return 0.8; // Default confidence
        }

        $totalConfidence = 0;
        $segmentCount = 0;

        foreach ($segments as $segment) {
            if (isset($segment['avg_logprob'])) {
                // Convert log probability to confidence (0-1)
                $confidence = exp($segment['avg_logprob']);
                $totalConfidence += $confidence;
                $segmentCount++;
            }
        }

        return $segmentCount > 0 ? $totalConfidence / $segmentCount : 0.8;
    }

    /**
     * Parse API error for user-friendly message
     */
    private function parseApiError(int $statusCode, string $errorBody): string
    {
        switch ($statusCode) {
            case 400:
                return 'Ongeldig audiobestand. Controleer het bestandsformaat en grootte.';
            case 401:
                return 'Ongeldige API sleutel. Controleer AZURE_WHISPER_KEY in .env';
            case 403:
                return 'Geen toegang tot Azure OpenAI service. Controleer je rechten.';
            case 404:
                return 'Azure Whisper model niet gevonden. Controleer AZURE_WHISPER_MODEL in .env';
            case 429:
                return 'Te veel verzoeken. Probeer het later opnieuw.';
            case 500:
                return 'Azure service fout. Probeer het later opnieuw.';
            default:
                try {
                    $error = json_decode($errorBody, true);
                    return $error['error']['message'] ?? "HTTP fout {$statusCode}";
                } catch (\Exception $e) {
                    return "HTTP fout {$statusCode}: {$errorBody}";
                }
        }
    }

    /**
     * Check if service is properly configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->endpoint) && 
               !empty($this->apiKey) && 
               !empty($this->model);
    }

    /**
     * Get configuration status for debugging
     */
    public function getConfigurationStatus(): array
    {
        return [
            'endpoint_set' => !empty($this->endpoint),
            'api_key_set' => !empty($this->apiKey),
            'model_set' => !empty($this->model),
            'endpoint' => $this->endpoint ? substr($this->endpoint, 0, 40) . '...' : null,
            'model' => $this->model,
            'language' => $this->language,
            'region' => $this->region,
            'timeout' => $this->timeout,
            'configured' => $this->isConfigured(),
        ];
    }
}