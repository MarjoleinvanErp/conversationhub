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
     * Process Whisper verification - ENHANCED WITH DEBUG
     */
    public function processWhisperVerification(
        string $sessionId,
        string $liveTranscriptionId,
        $audioChunk
    ): array {
        // Debug session data first
        Log::info('🔍 Debug Whisper verification start', [
            'session_id' => $sessionId,
            'live_transcription_id' => $liveTranscriptionId,
            'audio_chunk_size' => strlen($audioChunk)
        ]);

        $sessionData = $this->getSession($sessionId);
        if (!$sessionData) {
            Log::error('❌ Session not found', ['session_id' => $sessionId]);
            return ['success' => false, 'error' => 'Invalid session'];
        }

        // Debug session contents
        Log::info('🔍 Session data found', [
            'session_id' => $sessionId,
            'transcriptions_count' => count($sessionData['transcriptions'] ?? []),
            'session_keys' => array_keys($sessionData)
        ]);

        // Debug all transcription IDs in session
        $transcriptionIds = [];
        foreach ($sessionData['transcriptions'] as $index => $transcription) {
            $transcriptionIds[] = [
                'index' => $index,
                'id' => $transcription['id'],
                'text_preview' => substr($transcription['text'] ?? '', 0, 30),
                'status' => $transcription['processing_status'] ?? 'unknown'
            ];
        }
        
        Log::info('🔍 All transcriptions in session', [
            'looking_for_id' => $liveTranscriptionId,
            'available_transcriptions' => $transcriptionIds
        ]);
        
        $transcriptionIndex = null;
        foreach ($sessionData['transcriptions'] as $index => $transcription) {
            if ($transcription['id'] === $liveTranscriptionId) {
                $transcriptionIndex = $index;
                break;
            }
        }

        if ($transcriptionIndex === null) {
            Log::error('❌ Live transcription not found in session', [
                'session_id' => $sessionId,
                'looking_for_id' => $liveTranscriptionId,
                'available_ids' => array_column($sessionData['transcriptions'], 'id'),
                'total_transcriptions' => count($sessionData['transcriptions'])
            ]);
            return ['success' => false, 'error' => 'Live transcription not found'];
        }

        Log::info('✅ Found transcription for Whisper verification', [
            'transcription_index' => $transcriptionIndex,
            'transcription_id' => $liveTranscriptionId,
            'current_status' => $sessionData['transcriptions'][$transcriptionIndex]['processing_status']
        ]);

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

            Log::info('🤖 Calling Whisper API', [
                'temp_file_size' => filesize($tempFile),
                'transcription_id' => $liveTranscriptionId
            ]);

            $whisperResult = $this->whisperService->transcribeAudio($uploadedFile);

            Log::info('🤖 Whisper API result', [
                'success' => $whisperResult['success'],
                'error' => $whisperResult['error'] ?? null,
                'text_length' => isset($whisperResult['text']) ? strlen($whisperResult['text']) : 0
            ]);

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

                Log::info('✅ Whisper verification completed successfully', [
                    'transcription_id' => $liveTranscriptionId,
                    'whisper_text' => substr($whisperResult['text'], 0, 50) . '...'
                ]);
            } else {
                $sessionData['transcriptions'][$transcriptionIndex]['processing_status'] = 'error';
                $sessionData['transcriptions'][$transcriptionIndex]['whisper_error'] = $whisperResult['error'];
                
                Log::error('❌ Whisper API failed', [
                    'transcription_id' => $liveTranscriptionId,
                    'error' => $whisperResult['error']
                ]);
            }

            $this->saveSession($sessionId, $sessionData);

            return [
                'success' => true,
                'transcription' => $sessionData['transcriptions'][$transcriptionIndex],
                'whisper_result' => $whisperResult,
            ];

        } catch (\Exception $e) {
            Log::error('❌ Whisper verification exception', [
                'transcription_id' => $liveTranscriptionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

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
     * Save verified transcription to database - FIXED WITH DYNAMIC SOURCE
     */
    private function saveVerifiedTranscription(int $meetingId, array $transcription): void
    {
        try {
            // Determine correct source based on transcription type and origin
            $source = $this->determineTranscriptionSource($transcription);
            
            Log::info('Saving verified transcription to database', [
                'meeting_id' => $meetingId,
                'transcription_id' => $transcription['id'] ?? 'unknown',
                'source' => $source,
                'type' => $transcription['type'] ?? 'unknown',
                'processing_status' => $transcription['processing_status'] ?? 'unknown',
                'text_preview' => substr($transcription['text'] ?? '', 0, 50) . '...'
            ]);
            
            Transcription::create([
                'meeting_id' => $meetingId,
                'speaker_name' => $transcription['speaker_name'] ?? 'Onbekende Spreker',
                'speaker_id' => $transcription['speaker_id'] ?? 'unknown_speaker',
                'speaker_color' => $transcription['speaker_color'] ?? '#6B7280',
                'text' => $transcription['text'] ?? '',
                'confidence' => $transcription['text_confidence'] ?? 0.8,
                'source' => $source, // FIXED: Now uses dynamic source determination
                'is_final' => true,
                'spoken_at' => $transcription['timestamp'] ?? now()->toISOString(),
                'metadata' => json_encode([
                    'whisper_language' => $transcription['whisper_language'] ?? null,
                    'whisper_duration' => $transcription['whisper_duration'] ?? null,
                    'processing_status' => $transcription['processing_status'] ?? null,
                    'verified_at' => $transcription['verified_at'] ?? null,
                    'whisper_processed' => $transcription['whisper_processed'] ?? false,
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
     * Determine the correct source for a transcription based on its properties
     */
    private function determineTranscriptionSource(array $transcription): string
    {
        // Check if this transcription has been processed by Whisper
        if (isset($transcription['whisper_processed']) && $transcription['whisper_processed'] === true) {
            return 'whisper_verified';
        }

        // Check if this is a verified transcription (processed by Whisper)
        if (isset($transcription['type']) && $transcription['type'] === 'verified') {
            return 'whisper_verified';
        }

        // Check processing status
        if (isset($transcription['processing_status']) && $transcription['processing_status'] === 'verified') {
            return 'whisper_verified';
        }

        // Check if it has Whisper metadata
        if (isset($transcription['whisper_language']) || isset($transcription['whisper_duration'])) {
            return 'whisper_verified';
        }

        // Check original type
        if (isset($transcription['type'])) {
            switch ($transcription['type']) {
                case 'live':
                    return 'background_live';
                case 'whisper':
                case 'background_whisper':
                    return 'background_whisper';
                case 'verified':
                    return 'whisper_verified';
                default:
                    // Fallback based on confidence and processing
                    return $transcription['text_confidence'] >= 0.9 ? 'whisper_verified' : 'background_live';
            }
        }

        // Final fallback - if confidence is high, assume it's Whisper
        $confidence = $transcription['text_confidence'] ?? 0.8;
        return $confidence >= 0.9 ? 'whisper_verified' : 'background_live';
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
            $status = $transcription['processing_status'] ?? 'unknown';
            if (isset($statusCounts[$status])) {
                $statusCounts[$status]++;
            }
        }

        return [
            'total_transcriptions' => count($sessionData['transcriptions']),
            'status_breakdown' => $statusCounts,
            'verification_rate' => $statusCounts['verified'] / max(1, count($sessionData['transcriptions'])),
            'voice_setup_complete' => $sessionData['voice_setup_complete'] ?? false,
            'duration_minutes' => now()->diffInMinutes($sessionData['started_at'] ?? now()),
        ];
    }
}