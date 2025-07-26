<?php

namespace App\Services;

use App\Models\Transcription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class N8NTranscriptionService
{
    private $webhookUrl;
    private $apiKey;
    private $enabled;

    public function __construct()
    {
        $config = ConfigService::getN8NConfig();
	$this->webhookUrl = $config['transcription_webhook_url'];
        $this->apiKey = $config['api_key'];
        $this->enabled = !empty($this->webhookUrl);
    }

    /**
     * Send audio chunk to N8N for transcription
     */
    public function transcribeAudioChunk(string $audioData, string $sessionId, int $chunkNumber): ?array
    {
        if (!$this->enabled) {
            Log::info('N8N transcription disabled - webhook URL not configured');
            return null;
        }

        try {
            Log::info('Sending audio chunk to N8N for transcription', [
                'session_id' => $sessionId,
                'chunk_number' => $chunkNumber,
                'audio_size' => strlen($audioData)
            ]);

            $payload = [
                'session_id' => $sessionId,
                'chunk_number' => $chunkNumber,
                'audio_data' => base64_encode($audioData),
                'timestamp' => now()->toISOString(),
                'source' => 'conversationhub',
                'format' => 'webm',
                'processing_options' => [
                    'speaker_diarization' => true,
                    'language' => 'nl',
                    'return_segments' => true
                ]
            ];

            $headers = [
                'Content-Type' => 'application/json',
                'User-Agent' => 'ConversationHub/1.0'
            ];

            if ($this->apiKey) {
                $headers['Authorization'] = 'Bearer ' . $this->apiKey;
            }

            $response = Http::timeout(60)
                ->withHeaders($headers)
                ->post($this->webhookUrl, $payload);

            if ($response->successful()) {
                $result = $response->json();
                
                Log::info('N8N transcription successful', [
                    'session_id' => $sessionId,
                    'chunk_number' => $chunkNumber,
                    'transcription_length' => strlen($result['transcription'] ?? ''),
                    'speakers_detected' => count($result['speaker_analysis']['segments'] ?? [])
                ]);

                return $this->processN8NResponse($result, $sessionId, $chunkNumber);
            } else {
                Log::error('N8N transcription request failed', [
                    'session_id' => $sessionId,
                    'chunk_number' => $chunkNumber,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return null;
            }

        } catch (Exception $e) {
            Log::error('N8N transcription error', [
                'session_id' => $sessionId,
                'chunk_number' => $chunkNumber,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Process N8N response and save transcription(s)
     */
    private function processN8NResponse(array $response, string $sessionId, int $chunkNumber): ?array
    {
        try {
            $transcriptions = [];
            $speakerAnalysis = $response['speaker_analysis'] ?? [];
            $segments = $speakerAnalysis['segments'] ?? [];

            // If we have speaker segments, create separate transcriptions for each speaker
            if (!empty($segments)) {
                foreach ($segments as $segment) {
                    $transcriptionText = trim($segment['text'] ?? '');
                    if (empty($transcriptionText)) {
                        continue;
                    }

                    $speakerData = $this->processSpeakerInfo($segment, $sessionId);
                    $confidence = $segment['confidence'] ?? 0.0;

                    $transcription = Transcription::create([
                        'conversation_id' => $this->getOrCreateConversationId($sessionId),
                        'text' => $transcriptionText,
                        'speaker_id' => $speakerData['speaker_id'],
                        'speaker_name' => $speakerData['speaker_name'],
                        'speaker_color' => $speakerData['speaker_color'],
                        'confidence' => $confidence,
                        'speaker_confidence' => $speakerData['confidence'],
                        'source' => 'n8n',
                        'is_final' => true,
                        'spoken_at' => now(),
                        'processing_status' => 'completed',
                        'metadata' => [
                            'session_id' => $sessionId,
                            'chunk_number' => $chunkNumber,
                            'segment_start' => $segment['start'] ?? null,
                            'segment_end' => $segment['end'] ?? null,
                            'n8n_processing_time' => $response['processing_time_ms'] ?? null,
                            'segment_index' => count($transcriptions)
                        ]
                    ]);

                    $transcriptions[] = [
                        'id' => $transcription->id,
                        'text' => $transcription->text,
                        'speaker_name' => $transcription->speaker_name,
                        'speaker_id' => $transcription->speaker_id,
                        'speaker_color' => $transcription->speaker_color,
                        'confidence' => $transcription->confidence,
                        'speaker_confidence' => $transcription->speaker_confidence,
                        'spoken_at' => $transcription->spoken_at,
                        'source' => 'n8n',
                        'processing_status' => 'completed'
                    ];
                }
            } else {
                // Fallback: single transcription without speaker segmentation
                $transcriptionText = $response['transcription'] ?? '';
                if (!empty($transcriptionText)) {
                    $speakerData = $this->getDefaultSpeakerInfo();
                    $confidence = $response['confidence'] ?? 0.0;

                    $transcription = Transcription::create([
                        'conversation_id' => $this->getOrCreateConversationId($sessionId),
                        'text' => $transcriptionText,
                        'speaker_id' => $speakerData['speaker_id'],
                        'speaker_name' => $speakerData['speaker_name'],
                        'speaker_color' => $speakerData['speaker_color'],
                        'confidence' => $confidence,
                        'speaker_confidence' => $speakerData['confidence'],
                        'source' => 'n8n',
                        'is_final' => true,
                        'spoken_at' => now(),
                        'processing_status' => 'completed',
                        'metadata' => [
                            'session_id' => $sessionId,
                            'chunk_number' => $chunkNumber,
                            'n8n_processing_time' => $response['processing_time_ms'] ?? null
                        ]
                    ]);

                    $transcriptions[] = [
                        'id' => $transcription->id,
                        'text' => $transcription->text,
                        'speaker_name' => $transcription->speaker_name,
                        'speaker_id' => $transcription->speaker_id,
                        'speaker_color' => $transcription->speaker_color,
                        'confidence' => $transcription->confidence,
                        'speaker_confidence' => $transcription->speaker_confidence,
                        'spoken_at' => $transcription->spoken_at,
                        'source' => 'n8n',
                        'processing_status' => 'completed'
                    ];
                }
            }

            if (empty($transcriptions)) {
                Log::warning('N8N returned no valid transcriptions', [
                    'session_id' => $sessionId,
                    'chunk_number' => $chunkNumber
                ]);
                return null;
            }

            return [
                'success' => true,
                'transcriptions' => $transcriptions,
                'transcription' => $transcriptions[0], // Primary transcription for backward compatibility
                'speaker_analysis' => $speakerAnalysis,
                'n8n_metadata' => [
                    'processing_time' => $response['processing_time_ms'] ?? null,
                    'chunk_number' => $chunkNumber,
                    'segments_count' => count($segments)
                ]
            ];

        } catch (Exception $e) {
            Log::error('Failed to process N8N response', [
                'session_id' => $sessionId,
                'chunk_number' => $chunkNumber,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Process speaker information from N8N segment
     */
    private function processSpeakerInfo(array $segment, string $sessionId): array
    {
        $speakerId = $segment['speaker'] ?? 'unknown';
        $confidence = $segment['speaker_confidence'] ?? 0.0;

        $speakerName = $this->getSpeakerName($speakerId, $sessionId);
        $speakerColor = $this->getSpeakerColor($speakerId);

        return [
            'speaker_id' => $speakerId,
            'speaker_name' => $speakerName,
            'speaker_color' => $speakerColor,
            'confidence' => $confidence
        ];
    }

    /**
     * Get default speaker info when no speaker detection available
     */
    private function getDefaultSpeakerInfo(): array
    {
        return [
            'speaker_id' => 'unknown',
            'speaker_name' => 'Onbekende Spreker',
            'speaker_color' => '#6B7280',
            'confidence' => 0.0
        ];
    }

    /**
     * Get speaker name for speaker ID
     */
    private function getSpeakerName(string $speakerId, string $sessionId): string
    {
        $speakerNames = [
            'SPEAKER_00' => 'Spreker A',
            'SPEAKER_01' => 'Spreker B', 
            'SPEAKER_02' => 'Spreker C',
            'SPEAKER_03' => 'Spreker D',
            'SPEAKER_04' => 'Spreker E'
        ];

        return $speakerNames[$speakerId] ?? "Spreker {$speakerId}";
    }

    /**
     * Get color for speaker ID
     */
    private function getSpeakerColor(string $speakerId): string
    {
        $colors = [
            'SPEAKER_00' => '#3B82F6', // Blue
            'SPEAKER_01' => '#EF4444', // Red
            'SPEAKER_02' => '#10B981', // Green
            'SPEAKER_03' => '#F59E0B', // Yellow
            'SPEAKER_04' => '#8B5CF6', // Purple
            'unknown' => '#6B7280'     // Gray
        ];

        return $colors[$speakerId] ?? '#6B7280';
    }

    /**
     * Get or create conversation ID for session
     */
    private function getOrCreateConversationId(string $sessionId): int
    {
        // This should integrate with your existing conversation management
        // For now, return 1 or implement proper conversation creation
        return 1;
    }

    /**
     * Check if N8N transcription is available
     */
    public function isAvailable(): bool
    {
        return $this->enabled && ConfigService::isN8NTranscriptionEnabled();
    }

    /**
     * Test N8N connection
     */
    public function testConnection(): array
    {
        if (!$this->enabled) {
            return [
                'success' => false,
                'error' => 'N8N webhook URL not configured'
            ];
        }

        try {
            $testPayload = [
                'test' => true,
                'timestamp' => now()->toISOString(),
                'source' => 'conversationhub'
            ];

            $headers = [
                'Content-Type' => 'application/json',
                'User-Agent' => 'ConversationHub/1.0'
            ];

            if ($this->apiKey) {
                $headers['Authorization'] = 'Bearer ' . $this->apiKey;
            }

            $response = Http::timeout(10)
                ->withHeaders($headers)
                ->post($this->webhookUrl, $testPayload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'N8N connection successful',
                    'response_time' => $response->transferStats ? $response->transferStats->getTransferTime() : null
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'N8N returned status: ' . $response->status(),
                    'response' => $response->body()
                ];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Connection failed: ' . $e->getMessage()
            ];
        }
    }
}