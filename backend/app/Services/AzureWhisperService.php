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

    public function __construct()
    {
        $this->endpoint = config('conversation.azure_whisper.endpoint');
        $this->apiKey = config('conversation.azure_whisper.key');
        $this->model = config('conversation.azure_whisper.model', 'whisper');
    }

    /**
     * Transcribe audio file using Azure OpenAI Whisper
     */
    public function transcribeAudio(UploadedFile $audioFile): array
    {
        try {
            // Check if configured
            if (!$this->endpoint || !$this->apiKey) {
                return [
                    'success' => false,
                    'error' => 'Azure Whisper niet geconfigureerd'
                ];
            }

            // Build endpoint URL
            $url = rtrim($this->endpoint, '/') . '/openai/deployments/' . $this->model . '/audio/transcriptions?api-version=2024-06-01';
            
            // Read file
            $fileContents = file_get_contents($audioFile->getPathname());
            $fileName = $audioFile->getClientOriginalName();

            Log::info('Azure Whisper request', [
                'file_size' => $audioFile->getSize(),
                'file_type' => $audioFile->getMimeType(),
            ]);

            // Make API call
            $response = Http::timeout(30)
                ->withHeaders([
                    'api-key' => $this->apiKey,
                ])
                ->asMultipart()
                ->attach('file', $fileContents, $fileName)
                ->post($url, [
                    'model' => $this->model,
                    'language' => 'nl',
                    'response_format' => 'json',
                ]);

            if ($response->successful()) {
                $result = $response->json();
                
                return [
                    'success' => true,
                    'text' => $result['text'] ?? '',
                    'language' => $result['language'] ?? 'nl',
                    'duration' => 0, // Basic response doesn't include duration
                ];
            } else {
                Log::error('Azure Whisper error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Azure API fout: ' . $response->status()
                ];
            }

        } catch (\Exception $e) {
            Log::error('Azure Whisper exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Check if service is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->endpoint) && !empty($this->apiKey);
    }
}