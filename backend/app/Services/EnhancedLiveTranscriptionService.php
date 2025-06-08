<?php

namespace App\Services;

use App\Services\VoiceFingerprintService;
use App\Services\AzureWhisperService;
use App\Models\Transcription;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class EnhancedLiveTranscriptionService
{
    private $voiceService;
    private $whisperService;
    private $sessionPrefix = 'enhanced_session:';

    public function __construct(
        VoiceFingerprintService $voiceService,
        AzureWhisperService $whisperService
    ) {
        $this->voiceService = $voiceService;
        $this->whisperService = $whisperService;
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
     * Process live transcription with automatic speaker detection
     */
    public function processLiveTranscription(
        string $sessionId, 
        string $liveText,
        $audioSample = null,
        float $confidence = 0.8
    ): array {
        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return ['success' => false, 'error' => 'Invalid session'];
        }

        $sessionData['chunk_counter']++;

        $speakerInfo = ['speaker_id' => 'unknown_speaker', 'confidence' => 0.0];
        
        if ($audioSample && $sessionData['voice_setup_complete']) {
            $speakerInfo = $this->voiceService->identifySpeaker($audioSample);
        }

        $speaker = $this->findSpeakerDetails($sessionData['participants'], $speakerInfo['speaker_id']);

        $transcriptionEntry = [
            'id' => uniqid('live_', true),
            'type' => 'live',
            'text' => $liveText,
            'speaker_id' => $speakerInfo['speaker_id'],
            'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
            'speaker_color' => $speaker['color'] ?? '#6B7280',
            'speaker_confidence' => $speakerInfo['confidence'] ?? 0.0,
            'text_confidence' => $confidence,
            'timestamp' => now()->toISOString(),
            'chunk_number' => $sessionData['chunk_counter'],
            'processing_status' => 'live',
            'whisper_processed' => false,
        ];

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
     * Process Whisper verification
     */
    public function processWhisperVerification(
        string $sessionId,
        string $liveTranscriptionId,
        $audioChunk
    ): array {
        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return ['success' => false, 'error' => 'Invalid session'];
        }
        
        $transcriptionIndex = null;
        foreach ($sessionData['transcriptions'] as $index => $transcription) {
            if ($transcription['id'] === $liveTranscriptionId) {
                $transcriptionIndex = $index;
                break;
            }
        }

        if ($transcriptionIndex === null) {
            return ['success' => false, 'error' => 'Live transcription not found'];
        }

        $sessionData['transcriptions'][$transcriptionIndex]['processing_status'] = 'processing';
        $this->saveSession($sessionId, $sessionData);

        try {
            $tempFile = tempnam(storage_path('app/temp'), 'whisper_chunk_');
            file_put_contents($tempFile, $audioChunk);

            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $tempFile,
                'chunk.webm',
                'audio/webm',
                null,
                true
            );

            $whisperResult = $this->whisperService->transcribeAudio($uploadedFile);

            if ($whisperResult['success']) {
                $speakerInfo = $this->voiceService->identifySpeaker($audioChunk);
                $speaker = $this->findSpeakerDetails($sessionData['participants'], $speakerInfo['speaker_id']);

                $sessionData['transcriptions'][$transcriptionIndex] = array_merge(
                    $sessionData['transcriptions'][$transcriptionIndex],
                    [
                        'type' => 'verified',
                        'text' => $whisperResult['text'],
                        'speaker_id' => $speakerInfo['speaker_id'],
                        'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
                        'speaker_color' => $speaker['color'] ?? '#6B7280',
                        'speaker_confidence' => $speakerInfo['confidence'] ?? 0.0,
                        'text_confidence' => 1.0,
                        'processing_status' => 'verified',
                        'whisper_processed' => true,
                        'whisper_language' => $whisperResult['language'] ?? 'nl',
                        'whisper_duration' => $whisperResult['duration'] ?? 0,
                        'verified_at' => now()->toISOString(),
                    ]
                );

                $this->saveVerifiedTranscription($sessionData['meeting_id'], $sessionData['transcriptions'][$transcriptionIndex]);
            } else {
                $sessionData['transcriptions'][$transcriptionIndex]['processing_status'] = 'error';
                $sessionData['transcriptions'][$transcriptionIndex]['whisper_error'] = $whisperResult['error'];
            }

            $this->saveSession($sessionId, $sessionData);

            return [
                'success' => true,
                'transcription' => $sessionData['transcriptions'][$transcriptionIndex],
                'whisper_result' => $whisperResult,
            ];

        } catch (\Exception $e) {
            $sessionData['transcriptions'][$transcriptionIndex]['processing_status'] = 'error';
            $sessionData['transcriptions'][$transcriptionIndex]['whisper_error'] = $e->getMessage();
            $this->saveSession($sessionId, $sessionData);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'transcription' => $sessionData['transcriptions'][$transcriptionIndex],
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
            Transcription::create([
                'meeting_id' => $meetingId,
                'speaker_name' => $transcription['speaker_name'],
                'speaker_id' => $transcription['speaker_id'],
                'speaker_color' => $transcription['speaker_color'],
                'text' => $transcription['text'],
                'confidence' => $transcription['text_confidence'],
                'source' => 'live_verified',
                'is_final' => true,
                'spoken_at' => $transcription['timestamp'],
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
     * Get session statistics
     */
    private function getSessionStats(string $sessionId): array
    {
        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            return [];
        }
        
        $statusCounts = [
            'live' => 0,
            'processing' => 0,
            'verified' => 0,
            'error' => 0,
        ];

        foreach ($sessionData['transcriptions'] as $transcription) {
            $status = $transcription['processing_status'];
            $statusCounts[$status]++;
        }

        return [
            'total_transcriptions' => count($sessionData['transcriptions']),
            'status_breakdown' => $statusCounts,
            'verification_rate' => $statusCounts['verified'] / max(1, count($sessionData['transcriptions'])),
            'voice_setup_complete' => $sessionData['voice_setup_complete'],
            'duration_minutes' => now()->diffInMinutes($sessionData['started_at']),
        ];
    }
}