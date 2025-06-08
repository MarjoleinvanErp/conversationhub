<?php

namespace App\Services;

use App\Services\VoiceFingerprintService;
use App\Services\AzureWhisperService;
use App\Models\Transcription;
use Illuminate\Support\Facades\Log;

class EnhancedLiveTranscriptionService
{
    private $voiceService;
    private $whisperService;
    private $activeSessions = [];

    public function __construct(
        VoiceFingerprintService $voiceService,
        AzureWhisperService $whisperService
    ) {
        $this->voiceService = $voiceService;
        $this->whisperService = $whisperService;
    }

    /**
     * Start enhanced session with voice setup
     */
    public function startEnhancedSession(int $meetingId, array $participants = []): array
    {
        $sessionId = uniqid('enhanced_', true);
        
        $this->activeSessions[$sessionId] = [
            'meeting_id' => $meetingId,
            'started_at' => now(),
            'participants' => $participants,
            'transcriptions' => [],
            'voice_setup_complete' => false,
            'auto_speaker_detection' => true,
            'chunk_counter' => 0,
        ];

        $this->voiceService->loadVoiceProfiles($meetingId);

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
        if (!isset($this->activeSessions[$sessionId])) {
            return ['success' => false, 'error' => 'Invalid session'];
        }

        $result = $this->voiceService->createVoiceProfile($speakerId, $voiceSample);
        
        if ($result['success']) {
            $session = &$this->activeSessions[$sessionId];
            foreach ($session['participants'] as &$participant) {
                if ($participant['id'] === $speakerId) {
                    $participant['voice_setup'] = true;
                    break;
                }
            }

            $allSetup = true;
            foreach ($session['participants'] as $participant) {
                if (!($participant['voice_setup'] ?? false)) {
                    $allSetup = false;
                    break;
                }
            }
            
            $session['voice_setup_complete'] = $allSetup;
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
        if (!isset($this->activeSessions[$sessionId])) {
            return ['success' => false, 'error' => 'Invalid session'];
        }

        $session = &$this->activeSessions[$sessionId];
        $session['chunk_counter']++;

        $speakerInfo = ['speaker_id' => 'unknown_speaker', 'confidence' => 0.0];
        
        if ($audioSample && $session['voice_setup_complete']) {
            $speakerInfo = $this->voiceService->identifySpeaker($audioSample);
        }

        $speaker = $this->findSpeakerDetails($session['participants'], $speakerInfo['speaker_id']);

        $transcriptionEntry = [
            'id' => uniqid('live_', true),
            'type' => 'live',
            'text' => $liveText,
            'speaker_id' => $speakerInfo['speaker_id'],
            'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
            'speaker_color' => $speaker['color'] ?? '#6B7280',
            'speaker_confidence' => $speakerInfo['confidence'] ?? 0.0,
            'text_confidence' => $confidence,
            'timestamp' => now(),
            'chunk_number' => $session['chunk_counter'],
            'processing_status' => 'live',
            'whisper_processed' => false,
        ];

        $session['transcriptions'][] = $transcriptionEntry;

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
        if (!isset($this->activeSessions[$sessionId])) {
            return ['success' => false, 'error' => 'Invalid session'];
        }

        $session = &$this->activeSessions[$sessionId];
        
        $transcriptionIndex = null;
        foreach ($session['transcriptions'] as $index => $transcription) {
            if ($transcription['id'] === $liveTranscriptionId) {
                $transcriptionIndex = $index;
                break;
            }
        }

        if ($transcriptionIndex === null) {
            return ['success' => false, 'error' => 'Live transcription not found'];
        }

        $session['transcriptions'][$transcriptionIndex]['processing_status'] = 'processing';

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
                $speaker = $this->findSpeakerDetails($session['participants'], $speakerInfo['speaker_id']);

                $session['transcriptions'][$transcriptionIndex] = array_merge(
                    $session['transcriptions'][$transcriptionIndex],
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
                        'verified_at' => now(),
                    ]
                );

                $this->saveVerifiedTranscription($session['meeting_id'], $session['transcriptions'][$transcriptionIndex]);
            } else {
                $session['transcriptions'][$transcriptionIndex]['processing_status'] = 'error';
                $session['transcriptions'][$transcriptionIndex]['whisper_error'] = $whisperResult['error'];
            }

            return [
                'success' => true,
                'transcription' => $session['transcriptions'][$transcriptionIndex],
                'whisper_result' => $whisperResult,
            ];

        } catch (\Exception $e) {
            $session['transcriptions'][$transcriptionIndex]['processing_status'] = 'error';
            $session['transcriptions'][$transcriptionIndex]['whisper_error'] = $e->getMessage();

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'transcription' => $session['transcriptions'][$transcriptionIndex],
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
        $session = $this->activeSessions[$sessionId];
        
        $statusCounts = [
            'live' => 0,
            'processing' => 0,
            'verified' => 0,
            'error' => 0,
        ];

        foreach ($session['transcriptions'] as $transcription) {
            $status = $transcription['processing_status'];
            $statusCounts[$status]++;
        }

        return [
            'total_transcriptions' => count($session['transcriptions']),
            'status_breakdown' => $statusCounts,
            'verification_rate' => $statusCounts['verified'] / max(1, count($session['transcriptions'])),
            'voice_setup_complete' => $session['voice_setup_complete'],
            'duration_minutes' => now()->diffInMinutes($session['started_at']),
        ];
    }
}