<?php

namespace App\Services;

use App\Models\Transcription;
use App\Services\AzureWhisperService;
use App\Services\VoiceService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EnhancedLiveTranscriptionService
{
    private $whisperService;
    private $voiceService;

    public function __construct(AzureWhisperService $whisperService, VoiceService $voiceService)
    {
        $this->whisperService = $whisperService;
        $this->voiceService = $voiceService;
    }

    /**
     * Start enhanced transcription session
     */
    public function startEnhancedSession(int $meetingId, array $participants): array
    {
        try {
            $sessionId = 'session_' . $meetingId . '_' . time();
            
            // Create session data
            $sessionData = [
                'session_id' => $sessionId,
                'meeting_id' => $meetingId,
                'participants' => $participants,
                'started_at' => now()->toISOString(),
                'chunk_counter' => 0,
                'transcriptions' => []
            ];

            // Store session
            $this->saveSession($sessionId, $sessionData);

            // Store session ID in user's session
            session(['transcription_session_id' => $sessionId]);

            Log::info('Enhanced transcription session started', [
                'session_id' => $sessionId,
                'meeting_id' => $meetingId,
                'participants_count' => count($participants)
            ]);

            return [
                'success' => true,
                'session_id' => $sessionId,
                'participants' => $participants,
                'meeting_id' => $meetingId
            ];

        } catch (\Exception $e) {
            Log::error('Failed to start enhanced session', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to start enhanced session: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Setup voice profile for speaker
     */
    public function setupVoiceProfile(string $sessionId, string $speakerId, $voiceContent): array
    {
        try {
            $sessionData = $this->getSession($sessionId);
            if (!$sessionData) {
                return ['success' => false, 'error' => 'Invalid session'];
            }

            // Process voice sample with voice service
            $voiceResult = $this->voiceService->createVoiceProfile($speakerId, $voiceContent);

            if ($voiceResult['success']) {
                // Store voice profile in session
                if (!isset($sessionData['voice_profiles'])) {
                    $sessionData['voice_profiles'] = [];
                }
                
                $sessionData['voice_profiles'][$speakerId] = $voiceResult['profile'];
                $this->saveSession($sessionId, $sessionData);

                Log::info('Voice profile created', [
                    'session_id' => $sessionId,
                    'speaker_id' => $speakerId
                ]);

                return [
                    'success' => true,
                    'voice_profile' => $voiceResult['profile']
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $voiceResult['error']
                ];
            }

        } catch (\Exception $e) {
            Log::error('Voice profile setup failed', [
                'session_id' => $sessionId,
                'speaker_id' => $speakerId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Voice profile setup failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process live transcription (display only, no database storage)
     */
    public function processLiveTranscription(string $text, float $confidence): array
    {
        $sessionId = session('transcription_session_id');
        if (!$sessionId) {
            return ['success' => false, 'error' => 'No active session'];
        }

        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return ['success' => false, 'error' => 'Invalid session'];
        }

        // Detect speaker
        $speakerInfo = $this->voiceService->identifySpeaker(null);
        $speaker = $this->findSpeakerDetails($sessionData['participants'], $speakerInfo['speaker_id']);

        // Create transcription entry (for display and queuing only)
        $transcriptionEntry = [
            'id' => 'live_' . uniqid(),
            'type' => 'live',
            'text' => $text,
            'speaker_id' => $speakerInfo['speaker_id'],
            'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
            'speaker_color' => $speaker['color'] ?? '#6B7280',
            'speaker_confidence' => $speakerInfo['confidence'] ?? 0.0,
            'text_confidence' => $confidence,
            'timestamp' => now()->toISOString(),
            'chunk_number' => $sessionData['chunk_counter'],
            'processing_status' => 'live_display', // Only for display
            'whisper_processed' => false,
            'database_saved' => false, // Not saved to database
        ];

        // Update session counter
        $sessionData['chunk_counter'] = ($sessionData['chunk_counter'] ?? 0) + 1;
        
        // Add to session transcriptions for tracking
        $sessionData['transcriptions'][] = $transcriptionEntry;
        $this->saveSession($sessionId, $sessionData);

        return [
            'success' => true,
            'transcription' => $transcriptionEntry,
            'speaker_detection' => $speakerInfo,
            'session_stats' => $this->getSessionStats($sessionId),
        ];
    }

    /**
     * Process Whisper verification and save to database
     */
    public function processWhisperVerification(
        string $liveTranscriptionId,
        $audioChunk
    ): array {
        $sessionId = session('transcription_session_id');
        if (!$sessionId) {
            return ['success' => false, 'error' => 'No active session'];
        }

        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return ['success' => false, 'error' => 'Invalid session'];
        }
        
        try {
            // Create temporary file for Whisper processing
            $tempFile = tempnam(storage_path('app/temp'), 'whisper_chunk_');
            file_put_contents($tempFile, $audioChunk);

            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $tempFile,
                'chunk.webm',
                'audio/webm',
                null,
                true
            );

            // Process with Whisper
            $whisperResult = $this->whisperService->transcribeAudio($uploadedFile);

            if ($whisperResult['success']) {
                // Re-detect speaker for Whisper result
                $speakerInfo = $this->voiceService->identifySpeaker($audioChunk);
                $speaker = $this->findSpeakerDetails($sessionData['participants'], $speakerInfo['speaker_id']);

                // Create complete transcription entry
                $verifiedTranscription = [
                    'id' => 'whisper_' . uniqid(),
                    'type' => 'whisper_verified',
                    'text' => $whisperResult['text'],
                    'speaker_id' => $speakerInfo['speaker_id'],
                    'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
                    'speaker_color' => $speaker['color'] ?? '#6B7280',
                    'speaker_confidence' => $speakerInfo['confidence'] ?? 0.0,
                    'text_confidence' => 1.0, // Whisper is more accurate
                    'processing_status' => 'whisper_completed',
                    'whisper_processed' => true,
                    'whisper_language' => $whisperResult['language'] ?? 'nl',
                    'whisper_duration' => $whisperResult['duration'] ?? 0,
                    'verified_at' => now()->toISOString(),
                    'timestamp' => now()->toISOString(),
                    'database_saved' => true, // Mark as saved
                ];

                // Save to database immediately
                $this->saveVerifiedTranscription($sessionData['meeting_id'], $verifiedTranscription);

                // Update session
                $sessionData['transcriptions'][] = $verifiedTranscription;
                $this->saveSession($sessionId, $sessionData);

                Log::info('Whisper verification and database save completed', [
                    'transcription_id' => $verifiedTranscription['id'],
                    'text_preview' => substr($verifiedTranscription['text'], 0, 50) . '...',
                    'meeting_id' => $sessionData['meeting_id']
                ]);

                return [
                    'success' => true,
                    'transcription' => $verifiedTranscription,
                    'whisper_result' => $whisperResult,
                ];
            } else {
                Log::warning('Whisper processing failed', [
                    'session_id' => $sessionId,
                    'live_transcription_id' => $liveTranscriptionId,
                    'error' => $whisperResult['error']
                ]);

                return [
                    'success' => false,
                    'error' => $whisperResult['error']
                ];
            }

        } catch (\Exception $e) {
            Log::error('Whisper verification exception', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        } finally {
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    /**
     * Save verified transcription to database
     */
    private function saveVerifiedTranscription(int $meetingId, array $transcription): void
    {
        try {
            $savedTranscription = Transcription::create([
                'meeting_id' => $meetingId,
                'speaker_name' => $transcription['speaker_name'],
                'speaker_id' => $transcription['speaker_id'],
                'speaker_color' => $transcription['speaker_color'],
                'text' => $transcription['text'],
                'confidence' => $transcription['text_confidence'],
                'source' => 'whisper_verified',
                'is_final' => true,
                'spoken_at' => $transcription['timestamp'],
                'metadata' => json_encode([
                    'whisper_language' => $transcription['whisper_language'] ?? 'nl',
                    'whisper_duration' => $transcription['whisper_duration'] ?? 0,
                    'processing_status' => $transcription['processing_status'],
                    'chunk_number' => $transcription['chunk_number'] ?? 0,
                    'verified_at' => $transcription['verified_at'] ?? now()->toISOString()
                ])
            ]);

            Log::info('Whisper transcription saved to database', [
                'transcription_id' => $savedTranscription->id,
                'meeting_id' => $meetingId,
                'text_preview' => substr($transcription['text'], 0, 50) . '...',
                'source' => 'whisper_verified'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to save verified transcription', [
                'meeting_id' => $meetingId,
                'transcription_id' => $transcription['id'],
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get whisper transcriptions for meeting
     */
    public function getWhisperTranscriptions(int $meetingId): array
    {
        try {
            $transcriptions = Transcription::where('meeting_id', $meetingId)
                ->whereIn('source', ['whisper', 'whisper_verified', 'background_whisper'])
                ->orderBy('spoken_at', 'desc')
                ->get()
                ->map(function ($transcription) {
                    $metadata = json_decode($transcription->metadata, true) ?? [];
                    
                    return [
                        'id' => $transcription->id,
                        'text' => $transcription->text,
                        'speaker_name' => $transcription->speaker_name,
                        'speaker_color' => $transcription->speaker_color,
                        'confidence' => $transcription->confidence,
                        'timestamp' => $transcription->spoken_at,
                        'created_at' => $transcription->created_at,
                        'source' => 'whisper_verified',
                        'processing_status' => 'completed',
                        'database_saved' => true,
                        'metadata' => $metadata
                    ];
                })
                ->toArray();

            return [
                'success' => true,
                'transcriptions' => $transcriptions,
                'count' => count($transcriptions)
            ];

        } catch (\Exception $e) {
            Log::error('Failed to get whisper transcriptions', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'transcriptions' => [],
                'count' => 0
            ];
        }
    }

    /**
     * Save session data
     */
    private function saveSession(string $sessionId, array $sessionData): void
    {
        try {
            $sessionFile = storage_path("app/temp/session_{$sessionId}.json");
            file_put_contents($sessionFile, json_encode($sessionData, JSON_PRETTY_PRINT));
        } catch (\Exception $e) {
            Log::error('Failed to save session', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get session data
     */
    private function getSession(string $sessionId): ?array
    {
        try {
            $sessionFile = storage_path("app/temp/session_{$sessionId}.json");
            
            if (!file_exists($sessionFile)) {
                return null;
            }

            $content = file_get_contents($sessionFile);
            return json_decode($content, true);
        } catch (\Exception $e) {
            Log::error('Failed to get session', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get session statistics
     */
    private function getSessionStats(string $sessionId): array
    {
        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return [];
        }

        $transcriptions = $sessionData['transcriptions'] ?? [];
        $whisperProcessed = array_filter($transcriptions, fn($t) => $t['whisper_processed'] ?? false);

        return [
            'total_transcriptions' => count($transcriptions),
            'whisper_processed' => count($whisperProcessed),
            'processing_rate' => count($transcriptions) > 0 ? 
                round((count($whisperProcessed) / count($transcriptions)) * 100, 2) : 0,
            'session_duration' => $this->calculateSessionDuration($sessionData),
            'chunk_counter' => $sessionData['chunk_counter'] ?? 0
        ];
    }

    /**
     * Calculate session duration
     */
    private function calculateSessionDuration(array $sessionData): int
    {
        $startTime = $sessionData['started_at'] ?? null;
        if (!$startTime) {
            return 0;
        }

        try {
            $start = new \DateTime($startTime);
            $now = new \DateTime();
            return $now->getTimestamp() - $start->getTimestamp();
        } catch (\Exception $e) {
            return 0;
        }
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

    /**
     * Cleanup old sessions
     */
    public function cleanupOldSessions(): void
    {
        try {
            $tempPath = storage_path('app/temp');
            $files = glob($tempPath . '/session_*.json');
            
            foreach ($files as $file) {
                if (filemtime($file) < (time() - 24 * 60 * 60)) { // 24 hours old
                    unlink($file);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to cleanup old sessions', [
                'error' => $e->getMessage()
            ]);
        }
    }
}