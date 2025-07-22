<?php

namespace App\Services;

use App\Services\VoiceFingerprintService;
use App\Services\AzureWhisperService;
use App\Services\N8NTranscriptionService;
use App\Services\ConfigService;
use App\Models\Transcription;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

class EnhancedLiveTranscriptionService
{
    private $voiceService;
    private $whisperService;
    private $n8nService;
    private $sessionPrefix = 'enhanced_session:';

    public function __construct(
        VoiceFingerprintService $voiceService,
        AzureWhisperService $whisperService,
        N8NTranscriptionService $n8nService
    ) {
        $this->voiceService = $voiceService;
        $this->whisperService = $whisperService;
        $this->n8nService = $n8nService;
    }

    /**
     * Get session from Redis
     */
    private function getSession(string $sessionId): ?array
    {
        try {
            $sessionData = Redis::get($this->sessionPrefix . $sessionId);
            if ($sessionData) {
                return json_decode($sessionData, true);
            }
        } catch (\Exception $e) {
            Log::error('Failed to get session from Redis', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
        }
        return null;
    }

    /**
     * Save session to Redis
     */
    private function saveSession(string $sessionId, array $sessionData): void
    {
        try {
            // Session expires in 24 hours
            Redis::setex(
                $this->sessionPrefix . $sessionId,
                86400, // 24 hours
                json_encode($sessionData)
            );
        } catch (\Exception $e) {
            Log::error('Failed to save session to Redis', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get transcription configuration including N8N status
     */
    public function getTranscriptionConfig(): array
    {
        try {
            // Test service availability
            $availableServices = ['browser']; // Always available
            $serviceStatus = [];

            // Check Whisper availability
            $whisperAvailable = ConfigService::isWhisperEnabled();
            $allConfig = ConfigService::getAllConfig();
            if ($whisperAvailable) {
                $availableServices[] = 'whisper';
                $serviceStatus['whisper'] = [
                    'available' => true,
                    'configured' => $allConfig['azure']['whisper_configured'] ?? false,
                    'service_type' => 'azure_whisper'
                ];
            } else {
                $serviceStatus['whisper'] = [
                    'available' => false,
                    'configured' => false,
                    'missing_config' => 'Whisper service disabled or not configured'
                ];
            }

            // Check N8N availability
            $n8nConfig = ConfigService::getN8NConfig();
            $n8nAvailable = !empty($n8nConfig['webhook_url']);
            if ($n8nAvailable) {
                $availableServices[] = 'n8n';
                $serviceStatus['n8n'] = [
                    'available' => true,
                    'configured' => true,
                    'webhook_url' => $n8nConfig['webhook_url'],
                    'has_api_key' => !empty($n8nConfig['api_key'])
                ];
            } else {
                $serviceStatus['n8n'] = [
                    'available' => false,
                    'configured' => false,
                    'missing_config' => 'Webhook URL missing'
                ];
            }

            // Browser is always available
            $serviceStatus['browser'] = [
                'available' => true,
                'configured' => true,
                'note' => 'Browser Web Speech API - always available as fallback'
            ];

            $config = [
                'available_services' => $availableServices,
                'service_status' => $serviceStatus,
                'default_service' => count($availableServices) > 1 ? 'auto' : $availableServices[0],
                'supports_multi_service' => count($availableServices) > 1,
                'supports_n8n' => $n8nAvailable,
                'supports_whisper' => $whisperAvailable,
                'supports_voice_profiles' => true,
                'processing_options' => [
                    'chunk_interval_ms' => 5000,
                    'audio_format' => 'webm',
                    'language' => 'nl-NL',
                    'speaker_diarization' => true,
                    'voice_identification' => true
                ]
            ];

            Log::info('Transcription configuration retrieved', [
                'available_services' => $availableServices,
                'n8n_available' => $n8nAvailable,
                'whisper_available' => $whisperAvailable
            ]);

            return $config;

        } catch (\Exception $e) {
            Log::error('Failed to get transcription configuration', [
                'error' => $e->getMessage()
            ]);

            // Return minimal fallback config
            return [
                'available_services' => ['browser'],
                'service_status' => [
                    'browser' => ['available' => true, 'configured' => true]
                ],
                'default_service' => 'browser',
                'supports_multi_service' => false,
                'supports_n8n' => false,
                'supports_whisper' => false,
                'error' => 'Configuration retrieval failed'
            ];
        }
    }

    /**
     * Test available transcription services
     */
    public function testServices(): array
    {
        $results = [];
        
        try {
            // Test Whisper service
            $whisperAvailable = ConfigService::isWhisperEnabled();
            $allConfig = ConfigService::getAllConfig();
            
            if ($whisperAvailable) {
                try {
                    $results['whisper'] = [
                        'available' => true,
                        'configured' => $allConfig['azure']['whisper_configured'] ?? false,
                        'tested_at' => now()->toISOString(),
                        'service_type' => 'azure_whisper',
                        'note' => 'Configuration validated - Whisper enabled'
                    ];
                } catch (\Exception $e) {
                    $results['whisper'] = [
                        'available' => false,
                        'tested_at' => now()->toISOString(),
                        'error' => $e->getMessage()
                    ];
                }
            } else {
                $results['whisper'] = [
                    'available' => false,
                    'error' => 'Whisper service disabled'
                ];
            }

            // Test N8N service
            $n8nConfig = ConfigService::getN8NConfig();
            if (!empty($n8nConfig['webhook_url'])) {
                try {
                    // Test N8N service availability
                    $testResult = $this->n8nService->transcribeAudioChunk('test', 'test-session', 1);
                    
                    $results['n8n'] = [
                        'available' => $testResult !== null,
                        'tested_at' => now()->toISOString(),
                        'webhook_url' => $n8nConfig['webhook_url'],
                        'has_api_key' => !empty($n8nConfig['api_key']),
                        'test_result' => $testResult ? 'Connection successful' : 'Connection failed'
                    ];
                } catch (\Exception $e) {
                    $results['n8n'] = [
                        'available' => false,
                        'tested_at' => now()->toISOString(),
                        'error' => $e->getMessage()
                    ];
                }
            } else {
                $results['n8n'] = [
                    'available' => false,
                    'error' => 'N8N webhook URL not configured'
                ];
            }

            // Browser is always available
            $results['browser'] = [
                'available' => true,
                'tested_at' => now()->toISOString(),
                'note' => 'Browser Web Speech API is always available'
            ];

        } catch (\Exception $e) {
            Log::error('Service testing failed', [
                'error' => $e->getMessage()
            ]);
        }

        return $results;
    }

    /**
     * Set preferred service for a session
     */
    public function setPreferredService(string $sessionId, string $service): bool
    {
        try {
            Cache::put("preferred_service_{$sessionId}", $service, now()->addHours(24));
            
            Log::info('Preferred service set for session', [
                'session_id' => $sessionId,
                'service' => $service
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to set preferred service', [
                'session_id' => $sessionId,
                'service' => $service,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get preferred service for a session
     */
    public function getPreferredService(string $sessionId): string
    {
        try {
            return Cache::get("preferred_service_{$sessionId}", 'auto');
        } catch (\Exception $e) {
            Log::warning('Failed to get preferred service, using default', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
            return 'auto';
        }
    }

    /**
     * FIXED: Process live transcription with correct signature
     */
    public function processLiveTranscription(string $text, float $confidence = 0.8, array $options = []): array
    {
        try {
            $sessionId = $options['session_id'] ?? 'default_session_' . time();
            $preferredService = $options['preferred_service'] ?? 'auto';
            $useN8N = $options['use_n8n'] ?? false;
            
            Log::info('Enhanced live transcription processing started', [
                'session_id' => $sessionId,
                'text_length' => strlen($text),
                'confidence' => $confidence,
                'preferred_service' => $preferredService,
                'use_n8n' => $useN8N
            ]);

            $sessionData = $this->getSession($sessionId);
            if (!$sessionData) {
                // Create minimal session if it doesn't exist
                $sessionData = [
                    'meeting_id' => 1,
                    'started_at' => now()->toISOString(),
                    'participants' => [],
                    'transcriptions' => [],
                    'chunk_counter' => 0,
                ];
                $this->saveSession($sessionId, $sessionData);
            }

            $sessionData['chunk_counter']++;
            $chunkNumber = $sessionData['chunk_counter'];

            // Create basic transcription record
            $transcription = [
                'id' => uniqid('live_', true),
                'text' => $text,
                'confidence' => $confidence,
                'session_id' => $sessionId,
                'source' => 'live',
                'created_at' => now()->toISOString(),
                'speaker_name' => 'Speaker',
                'speaker_color' => '#6B7280',
                'chunk_number' => $chunkNumber,
                'processing_status' => 'completed'
            ];

            $transcriptions = [$transcription];
            $processingDetails = [
                'service_used' => 'live_text',
                'processed_at' => now()->toISOString(),
                'chunk_number' => $chunkNumber
            ];

            // Update session data
            $sessionData['transcriptions'][] = $transcription;
            $this->saveSession($sessionId, $sessionData);

            return [
                'success' => true,
                'transcription' => $transcription,
                'transcriptions' => $transcriptions,
                'session_stats' => $this->getSessionStats($sessionId),
                'processing_details' => $processingDetails
            ];

        } catch (\Exception $e) {
            Log::error('Live transcription processing failed', [
                'text_length' => strlen($text),
                'options' => $options,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'session_stats' => $this->getSessionStats($options['session_id'] ?? null)
            ];
        }
    }

    /**
     * FIXED: Process Whisper verification with audio data
     */
    public function processWhisperVerification(string $transcriptionId, $audioData): array
    {
        try {
            Log::info('Processing Whisper verification for 90-second chunk', [
                'transcription_id' => $transcriptionId,
                'audio_size' => strlen($audioData)
            ]);

            // Create temporary file for Whisper
            $tempFile = tempnam(storage_path('app/temp'), 'whisper_chunk_');
            file_put_contents($tempFile, $audioData);

            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $tempFile,
                'chunk.webm',
                'audio/webm',
                null,
                true
            );

            Log::info('Calling Whisper API for chunk transcription', [
                'temp_file_size' => filesize($tempFile),
                'transcription_id' => $transcriptionId
            ]);

            $whisperResult = $this->whisperService->transcribeAudio($uploadedFile);

            if ($whisperResult['success']) {
                $transcription = [
                    'id' => $transcriptionId,
                    'text' => $whisperResult['text'],
                    'speaker_name' => 'Speaker', // TODO: Add speaker diarization
                    'speaker_id' => 'unknown_speaker',
                    'speaker_color' => '#6B7280',
                    'confidence' => 0.95,
                    'speaker_confidence' => 0.0,
                    'spoken_at' => now()->toISOString(),
                    'source' => 'whisper',
                    'processing_status' => 'completed',
                    'whisper_language' => $whisperResult['language'] ?? 'nl',
                    'whisper_duration' => $whisperResult['duration'] ?? 0,
                    'database_saved' => false // Will be updated if saved to DB
                ];

                // TODO: Save to database if meeting context is available
                // For now, just return the transcription

                Log::info('Whisper chunk transcription completed successfully', [
                    'transcription_id' => $transcriptionId,
                    'text_length' => strlen($whisperResult['text']),
                    'language' => $whisperResult['language'] ?? 'unknown'
                ]);

                return [
                    'success' => true,
                    'transcription' => $transcription,
                    'whisper_result' => $whisperResult
                ];

            } else {
                Log::error('Whisper API failed for chunk', [
                    'transcription_id' => $transcriptionId,
                    'error' => $whisperResult['error']
                ]);

                return [
                    'success' => false,
                    'error' => 'Whisper transcription failed: ' . $whisperResult['error']
                ];
            }

        } catch (\Exception $e) {
            Log::error('Whisper verification exception', [
                'transcription_id' => $transcriptionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Whisper processing failed: ' . $e->getMessage()
            ];
        } finally {
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    /**
     * NEW: Process with N8N workflow for 90-second chunks
     */
    public function processWithN8N($audioData, array $options = []): array
    {
        try {
            $sessionId = $options['session_id'] ?? 'n8n_session_' . time();
            $chunkNumber = $options['chunk_number'] ?? 1;

            Log::info('Processing 90-second chunk with N8N workflow', [
                'session_id' => $sessionId,
                'chunk_number' => $chunkNumber,
                'audio_size' => strlen($audioData)
            ]);

            // Use N8N service to process the audio chunk
            $n8nResult = $this->n8nService->transcribeAudioChunk($audioData, $sessionId, $chunkNumber);
            
            if ($n8nResult && $n8nResult['success']) {
                Log::info('N8N chunk processing successful', [
                    'session_id' => $sessionId,
                    'chunk_number' => $chunkNumber,
                    'transcriptions_count' => count($n8nResult['transcriptions'] ?? [])
                ]);

                return [
                    'success' => true,
                    'transcription' => $n8nResult['transcription'] ?? $n8nResult['transcriptions'][0] ?? null,
                    'transcriptions' => $n8nResult['transcriptions'] ?? [],
                    'speaker_analysis' => $n8nResult['speaker_analysis'] ?? null,
                    'n8n_metadata' => $n8nResult['n8n_metadata'] ?? [],
                    'processing_details' => [
                        'service_used' => 'n8n',
                        'chunk_number' => $chunkNumber,
                        'processing_time' => $n8nResult['n8n_metadata']['processing_time'] ?? null,
                        'processed_at' => now()->toISOString()
                    ]
                ];
            } else {
                Log::error('N8N chunk processing failed', [
                    'session_id' => $sessionId,
                    'chunk_number' => $chunkNumber,
                    'error' => $n8nResult['error'] ?? 'Unknown N8N error'
                ]);

                return [
                    'success' => false,
                    'error' => 'N8N processing failed: ' . ($n8nResult['error'] ?? 'Unknown error')
                ];
            }

        } catch (\Exception $e) {
            Log::error('N8N processing exception', [
                'session_id' => $options['session_id'] ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'N8N processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Start enhanced session with voice setup
     */
    public function startEnhancedSession(int $meetingId, array $participants = []): array
    {
        $sessionId = uniqid('enhanced_', true);
        
        Log::info('Creating new enhanced session', [
            'session_id' => $sessionId,
            'meeting_id' => $meetingId,
            'participants_count' => count($participants),
            'participants' => $participants
        ]);
        
        $sessionData = [
            'meeting_id' => $meetingId,
            'started_at' => now()->toISOString(),
            'participants' => $participants,
            'transcriptions' => [],
            'voice_setup_complete' => false,
            'auto_speaker_detection' => true,
            'chunk_counter' => 0,
        ];

        // Save to Redis
        $this->saveSession($sessionId, $sessionData);

        $this->voiceService->loadVoiceProfiles($meetingId);

        Log::info('Enhanced session created and saved to Redis', [
            'session_id' => $sessionId,
        ]);

        return [
            'success' => true,
            'session_id' => $sessionId,
            'voice_setup_required' => !empty($participants),
            'participants' => $participants,
        ];
    }

    /**
     * Setup voice profile for participant
     */
    public function setupVoiceProfile(string $sessionId, string $speakerId, $voiceSample): array
    {
        Log::info('Setting up voice profile', [
            'session_id' => $sessionId,
            'speaker_id' => $speakerId,
        ]);

        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            Log::error('Session not found in Redis', [
                'session_id' => $sessionId,
                'speaker_id' => $speakerId,
            ]);
            return ['success' => false, 'error' => 'Invalid session - session not found'];
        }

        Log::info('Session found, creating voice profile', [
            'session_id' => $sessionId,
            'speaker_id' => $speakerId,
            'session_data' => $sessionData,
        ]);

        $result = $this->voiceService->createVoiceProfile($speakerId, $voiceSample);
        
        if ($result['success']) {
            // Update participants in session
            foreach ($sessionData['participants'] as &$participant) {
                if ($participant['id'] === $speakerId) {
                    $participant['voice_setup'] = true;
                    break;
                }
            }

            // Check if all participants have voice setup
            $allSetup = true;
            foreach ($sessionData['participants'] as $participant) {
                if (!($participant['voice_setup'] ?? false)) {
                    $allSetup = false;
                    break;
                }
            }
            
            $sessionData['voice_setup_complete'] = $allSetup;
            
            // Save updated session
            $this->saveSession($sessionId, $sessionData);

            Log::info('Voice profile setup completed and session updated', [
                'session_id' => $sessionId,
                'speaker_id' => $speakerId,
                'all_setup' => $allSetup,
            ]);
        }

        return $result;
    }

    /**
     * Get session statistics
     */
    public function getSessionStats(?string $sessionId): ?array
    {
        if (!$sessionId) {
            return null;
        }

        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return [
                'session_id' => $sessionId,
                'total_transcriptions' => 0,
                'session_duration' => '00:00:00',
                'last_activity' => now()->toISOString()
            ];
        }
        
        $statusCounts = [
            'live' => 0,
            'processing' => 0,
            'verified' => 0,
            'error' => 0,
            'completed' => 0,
        ];

        foreach ($sessionData['transcriptions'] as $transcription) {
            $status = $transcription['processing_status'] ?? 'unknown';
            if (isset($statusCounts[$status])) {
                $statusCounts[$status]++;
            }
        }

        return [
            'session_id' => $sessionId,
            'total_transcriptions' => count($sessionData['transcriptions']),
            'status_breakdown' => $statusCounts,
            'verification_rate' => $statusCounts['verified'] / max(1, count($sessionData['transcriptions'])),
            'voice_setup_complete' => $sessionData['voice_setup_complete'] ?? false,
            'duration_minutes' => now()->diffInMinutes($sessionData['started_at'] ?? now()),
            'chunk_counter' => $sessionData['chunk_counter'] ?? 0,
            'last_activity' => now()->toISOString()
        ];
    }

    /**
     * End session and cleanup
     */
    public function endSession(string $sessionId): array
    {
        try {
            $sessionData = $this->getSession($sessionId);
            if (!$sessionData) {
                return ['success' => false, 'error' => 'Session not found'];
            }

            // Get final stats before cleanup
            $finalStats = $this->getSessionStats($sessionId);

            // Remove session from Redis
            Redis::del($this->sessionPrefix . $sessionId);

            Log::info('Session ended and cleaned up', [
                'session_id' => $sessionId,
                'final_stats' => $finalStats
            ]);

            return [
                'success' => true,
                'final_stats' => $finalStats,
                'message' => 'Session ended successfully'
            ];

        } catch (\Exception $e) {
            Log::error('Failed to end session', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to end session: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Save verified transcription to database
     */
    private function saveVerifiedTranscription(int $meetingId, array $transcription): void
    {
        try {
            $source = $this->determineTranscriptionSource($transcription);
            
            Log::info('Saving verified transcription to database', [
                'meeting_id' => $meetingId,
                'transcription_id' => $transcription['id'] ?? 'unknown',
                'source' => $source,
                'text_preview' => substr($transcription['text'] ?? '', 0, 50) . '...'
            ]);
            
            Transcription::create([
                'meeting_id' => $meetingId,
                'speaker_name' => $transcription['speaker_name'] ?? 'Onbekende Spreker',
                'speaker_id' => $transcription['speaker_id'] ?? 'unknown_speaker',
                'speaker_color' => $transcription['speaker_color'] ?? '#6B7280',
                'text' => $transcription['text'] ?? '',
                'confidence' => $transcription['confidence'] ?? 0.8,
                'source' => $source,
                'is_final' => true,
                'spoken_at' => $transcription['created_at'] ?? now()->toISOString(),
                'metadata' => json_encode([
                    'whisper_language' => $transcription['whisper_language'] ?? null,
                    'whisper_duration' => $transcription['whisper_duration'] ?? null,
                    'processing_status' => $transcription['processing_status'] ?? null,
                    'chunk_number' => $transcription['chunk_number'] ?? null,
                    'speaker_confidence' => $transcription['speaker_confidence'] ?? 0.0,
                ])
            ]);
            
            Log::info('Verified transcription saved successfully', [
                'meeting_id' => $meetingId,
                'source' => $source,
                'transcription_id' => $transcription['id'] ?? 'unknown'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to save verified transcription', [
                'meeting_id' => $meetingId,
                'transcription_id' => $transcription['id'] ?? 'unknown',
                'error' => $e->getMessage(),
                'transcription_data' => $transcription
            ]);
        }
    }

    /**
     * Determine the correct source for a transcription
     */
    private function determineTranscriptionSource(array $transcription): string
    {
        if (isset($transcription['source'])) {
            switch ($transcription['source']) {
                case 'n8n':
                    return 'n8n';
                case 'whisper':
                    return 'whisper';
                case 'live':
                    return 'live';
                default:
                    break;
            }
        }

        // Check if this transcription has been processed by Whisper
        if (isset($transcription['whisper_processed']) && $transcription['whisper_processed'] === true) {
            return 'whisper_verified';
        }

        // Check processing status
        if (isset($transcription['processing_status']) && $transcription['processing_status'] === 'verified') {
            return 'whisper_verified';
        }

        // Final fallback based on confidence
        $confidence = $transcription['confidence'] ?? 0.8;
        return $confidence >= 0.9 ? 'whisper' : 'live';
    }

    /**
     * Find speaker details by ID
     */
    private function findSpeakerDetails(array $participants, string $speakerId): ?array
    {
        foreach ($participants as $participant) {
            if ($participant['id'] === $speakerId) {
                return $participant;
            }
        }
        return null;
    }
}