<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class MockWhisperService
{
    /**
     * Mock transcribe audio - voor testing zonder Azure
     */
    public function transcribeAudio(UploadedFile $audioFile): array
    {
        try {
            $fileName = $audioFile->getClientOriginalName();
            $fileSize = $audioFile->getSize();
            $mimeType = $audioFile->getMimeType();
            
            Log::info('Mock Whisper processing audio', [
                'filename' => $fileName,
                'size' => $fileSize,
                'mime_type' => $mimeType
            ]);
            
            // Simuleer processing tijd
            usleep(500000); // 0.5 seconden delay
            
            // Mock transcriptie gebaseerd op bestandsnaam of random
            $mockTexts = [
                'Dit is een test transcriptie van je audiobestand.',
                'Hallo, dit is een voorbeeld van spraak naar tekst transcriptie.',
                'De mock Whisper service werkt correct en heeft je audiobestand verwerkt.',
                'Test transcriptie succesvol voltooid met mock Azure service.',
                'Je audio is verwerkt door de test versie van Whisper AI.'
            ];
            
            $randomText = $mockTexts[array_rand($mockTexts)];
            
            // Voeg bestandsnaam toe voor herkenning
            $finalText = $randomText . " (Bestand: {$fileName})";
            
            return [
                'success' => true,
                'text' => $finalText,
                'language' => 'nl',
                'confidence' => 0.95,
                'duration' => round($fileSize / 16000, 2), // Mock duration
                'segments' => [
                    [
                        'start' => 0.0,
                        'end' => round($fileSize / 16000, 2),
                        'text' => $finalText,
                        'confidence' => 0.95
                    ]
                ],
                'metadata' => [
                    'service' => 'mock_whisper',
                    'model' => 'whisper-mock-1',
                    'processed_at' => now()->toISOString(),
                    'file_info' => [
                        'name' => $fileName,
                        'size' => $fileSize,
                        'type' => $mimeType
                    ]
                ]
            ];
            
        } catch (\Exception $e) {
            Log::error('Mock Whisper transcription failed', [
                'error' => $e->getMessage(),
                'file' => $audioFile->getClientOriginalName()
            ]);
            
            return [
                'success' => false,
                'error' => 'Mock transcription failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Check if service is configured
     */
    public function isConfigured(): bool
    {
        return true; // Mock is altijd "geconfigureerd"
    }
    
    /**
     * Get configuration status
     */
    public function getConfigurationStatus(): array
    {
        return [
            'service' => 'mock_whisper',
            'configured' => true,
            'endpoint' => 'mock://whisper-test',
            'model' => 'whisper-mock-1',
            'status' => 'ready'
        ];
    }
}