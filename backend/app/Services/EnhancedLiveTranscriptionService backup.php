<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\Transcription;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class EnhancedLiveTranscriptionService
{
    private $azureWhisperService;
    private $voiceService;
    private $meetingService;

    public function __construct(
        AzureWhisperService $azureWhisperService,
        VoiceService $voiceService,
        MeetingService $meetingService
    ) {
        $this->azureWhisperService = $azureWhisperService;
        $this->voiceService = $voiceService;
        $this->meetingService = $meetingService;
    }

    /**
     * Start enhanced session
     */
    public function startEnhancedSession(int $meetingId, array $participants): array
    {
        try {
            $meeting = Meeting::findOrFail($meetingId);
            $sessionId = uniqid('session_', true);

            $sessionData = [
                'session_id' => $sessionId,
                'meeting_id' => $meetingId,
                'participants' => $participants,
                'voice_setup_complete' => false,
                'voice_profiles' => [],
                'created_at' => now(),
                'chunk_counter' => 0,
            ];

            $this->saveSession($sessionId, $sessionData);

            Log::info('Enhanced session started', [
                'session_id' => $sessionId,
                'meeting_id' => $meetingId,
                'participant_count' => count($participants)
            ]);

            return [
                'success' => true,
                'session_id' => $sessionId,
                'meeting_id' => $meetingId,
                'participants' => $participants
            ];

        } catch (\Exception $e) {
            Log::error('Failed to start enhanced session', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to start session: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Setup voice profile met VoiceService integratie
     */
    public function setupVoiceProfile(string $sessionId, string $speakerId, $audioContent): array
    {
        try {
            $sessionData = $this->getSession($sessionId);
            if (!$sessionData) {
                return ['success' => false, 'error' => 'Invalid session'];
            }

            Log::info('Setting up voice profile', [
                'session_id' => $sessionId,
                'speaker_id' => $speakerId
            ]);

            // Load existing voice profiles into VoiceService
            $this->voiceService->loadVoiceProfilesFromSession($sessionData);

            // Setup voice profile
            $result = $this->voiceService->setupVoiceProfile($speakerId, $audioContent);

            if ($result['success']) {
                // Update session with voice profiles
                $sessionData['voice_profiles'] = $this->voiceService->saveVoiceProfilesToSession();
                
                // Mark participant as setup
                foreach ($sessionData['participants'] as &$participant) {
                    if ($participant['id'] === $speakerId) {
                        $participant['voice_setup'] = true;
                        break;
                    }
                }

                // Check if all participants are setup
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

                Log::info('Voice profile setup completed', [
                    'session_id' => $sessionId,
                    'speaker_id' => $speakerId,
                    'all_setup' => $allSetup,
                ]);
            }

            return $result;

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
     * Process live transcription met automatische spreker detectie
     */
    public function processLiveTranscription(
        string $sessionId, 
        string $liveText,
        $audioSample = null,
        float $confidence = 0.8
    ): array {
        try {
            $sessionData = $this->getSession($sessionId);
            if (!$sessionData) {
                return ['success' => false, 'error' => 'Invalid session'];
            }

            $sessionData['chunk_counter']++;

            // Load voice profiles for speaker identification
            $this->voiceService->loadVoiceProfilesFromSession($sessionData);

            // Default spreker info
            $speakerInfo = [
                'speaker_id' => 'unknown_speaker', 
                'confidence' => 0.0,
                'method' => 'fallback'
            ];
            
            // Probeer spreker herkenning als we audio hebben en voice setup compleet is
            if ($audioSample && $sessionData['voice_setup_complete']) {
                Log::info('Attempting speaker identification', [
                    'session_id' => $sessionId,
                    'has_audio' => true,
                    'voice_setup_complete' => true
                ]);
                
                $speakerInfo = $this->voiceService->identifySpeaker($audioSample);
                
                Log::info('Speaker identification result', [
                    'session_id' => $sessionId,
                    'identified_speaker' => $speakerInfo['speaker_id'],
                    'confidence' => $speakerInfo['confidence']
                ]);
            } else {
                Log::info('Speaker identification skipped', [
                    'session_id' => $sessionId,
                    'has_audio' => !!$audioSample,
                    'voice_setup_complete' => $sessionData['voice_setup_complete'] ?? false
                ]);
            }

            // Find speaker details
            $speaker = $this->findSpeakerDetails($sessionData['participants'], $speakerInfo['speaker_id']);

            // Create transcription entry
            $transcriptionData = [
                'meeting_id' => $sessionData['meeting_id'],
                'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
                'speaker_id' => $speakerInfo['speaker_id'],
                'speaker_color' => $speaker['color'] ?? '#6B7280',
                'text' => $liveText,
                'confidence' => $confidence,
                'speaker_confidence' => $speakerInfo['confidence'],
                'source' => 'enhanced_live',
                'is_final' => true,
                'spoken_at' => now(),
                'processing_status' => 'completed',
                'metadata' => [
                    'session_id' => $sessionId,
                    'speaker_detection_method' => $speakerInfo['method'] ?? 'fallback',
                    'chunk_number' => $sessionData['chunk_counter']
                ]
            ];

            // Save to database
            $transcription = Transcription::create($transcriptionData);

            // Update session
            $this->saveSession($sessionId, $sessionData);

            Log::info('Live transcription processed with speaker identification', [
                'session_id' => $sessionId,
                'transcription_id' => $transcription->id,
                'identified_speaker' => $speakerInfo['speaker_id'],
                'speaker_confidence' => $speakerInfo['confidence']
            ]);

            return [
                'success' => true,
                'transcription' => [
                    'id' => $transcription->id,
                    'text' => $transcription->text,
                    'speaker_name' => $transcription->speaker_name,
                    'speaker_id' => $transcription->speaker_id,
                    'speaker_color' => $transcription->speaker_color,
                    'confidence' => $transcription->confidence,
                    'speaker_confidence' => $transcription->speaker_confidence,
                    'spoken_at' => $transcription->spoken_at,
                    'source' => $transcription->source,
                    'processing_status' => $transcription->processing_status
                ],
                'speaker_identification' => $speakerInfo,
                'session_stats' => [
                    'total_chunks' => $sessionData['chunk_counter'],
                    'voice_setup_complete' => $sessionData['voice_setup_complete']
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Live transcription processing failed', [
                'session_id' => $sessionId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to process live transcription: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process Whisper verification met speaker identification
     */
    public function processWhisperVerification(
        string $sessionId,
        string $liveTranscriptionId,
        $audioContent
    ): array {
        try {
            $sessionData = $this->getSession($sessionId);
            if (!$sessionData) {
                return ['success' => false, 'error' => 'Invalid session'];
            }

            // Find original transcription
            $originalTranscription = Transcription::find($liveTranscriptionId);
            if (!$originalTranscription) {
                return ['success' => false, 'error' => 'Original transcription not found'];
            }

            Log::info('Starting Whisper verification with speaker identification', [
                'session_id' => $sessionId,
                'original_transcription_id' => $liveTranscriptionId,
                'audio_size' => strlen($audioContent)
            ]);

            // TEMP DEBUG - Check audio content details
            Log::info('TEMP DEBUG: Audio content analysis', [
                'session_id' => $sessionId,
                'transcription_id' => $liveTranscriptionId,
                'audio_size_bytes' => strlen($audioContent),
                'audio_size_kb' => round(strlen($audioContent) / 1024, 2),
                'audio_first_20_bytes_hex' => bin2hex(substr($audioContent, 0, 20)),
                'audio_last_20_bytes_hex' => bin2hex(substr($audioContent, -20)),
                'audio_is_empty' => empty($audioContent),
                'audio_starts_with_webm' => substr($audioContent, 0, 4) === "\x1A\x45\xDF\xA3",
                'audio_starts_with_wav' => substr($audioContent, 0, 4) === "RIFF",
                'estimated_duration_sec' => round(strlen($audioContent) / 16000, 2)
            ]);

            // Load voice profiles
            $this->voiceService->loadVoiceProfilesFromSession($sessionData);

            // Probeer spreker herkenning vanaf audio
            $speakerInfo = [
                'speaker_id' => 'unknown_speaker',
                'confidence' => 0.0,
                'method' => 'fallback'
            ];

            if ($sessionData['voice_setup_complete']) {
                Log::info('TEMP DEBUG: Starting speaker identification', [
                    'session_id' => $sessionId,
                    'voice_profiles_count' => count($sessionData['voice_profiles'] ?? [])
                ]);
                
                $speakerInfo = $this->voiceService->identifySpeaker($audioContent);
                
                Log::info('Whisper speaker identification result', [
                    'session_id' => $sessionId,
                    'identified_speaker' => $speakerInfo['speaker_id'],
                    'confidence' => $speakerInfo['confidence'],
                    'method' => $speakerInfo['method'] ?? 'unknown'
                ]);
            } else {
                Log::info('TEMP DEBUG: Speaker identification skipped - voice setup not complete', [
                    'session_id' => $sessionId
                ]);
            }

            // Create temp audio file for Whisper - FIXED METHOD CALL
            $tempFile = tmpfile();
            if (!$tempFile) {
                Log::error('TEMP DEBUG: Failed to create temp file', ['session_id' => $sessionId]);
                return ['success' => false, 'error' => 'Failed to create temporary file'];
            }

            $bytesWritten = fwrite($tempFile, $audioContent);
            $tempPath = stream_get_meta_data($tempFile)['uri'];

            Log::info('TEMP DEBUG: Temp file created for Whisper', [
                'session_id' => $sessionId,
                'temp_path' => $tempPath,
                'bytes_written' => $bytesWritten,
                'file_exists' => file_exists($tempPath),
                'file_size' => file_exists($tempPath) ? filesize($tempPath) : 0
            ]);

            // Create UploadedFile instance voor AzureWhisperService
            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $tempPath,
                'whisper_chunk_' . time() . '.webm',
                'audio/webm',
                null,
                true // test mode
            );

            Log::info('TEMP DEBUG: UploadedFile created', [
                'session_id' => $sessionId,
                'file_path' => $uploadedFile->getPathname(),
                'file_size' => $uploadedFile->getSize(),
                'file_type' => $uploadedFile->getMimeType(),
                'original_name' => $uploadedFile->getClientOriginalName()
            ]);

            // Process with Whisper - FIXED: gebruik transcribeAudio() in plaats van transcribeAudioFile()
            Log::info('TEMP DEBUG: Calling Azure Whisper API', [
                'session_id' => $sessionId,
                'file_ready' => $uploadedFile->isValid()
            ]);

            $whisperResult = $this->azureWhisperService->transcribeAudio($uploadedFile);

            Log::info('TEMP DEBUG: Azure Whisper API response', [
                'session_id' => $sessionId,
                'success' => $whisperResult['success'] ?? false,
                'has_text' => !empty($whisperResult['text'] ?? ''),
                'text_length' => strlen($whisperResult['text'] ?? ''),
                'text_preview' => substr($whisperResult['text'] ?? '', 0, 100),
                'language' => $whisperResult['language'] ?? 'unknown',
                'confidence' => $whisperResult['confidence'] ?? 0,
                'error' => $whisperResult['error'] ?? null
            ]);

            // Cleanup temp file
            fclose($tempFile);

            if (!$whisperResult['success']) {
                Log::error('TEMP DEBUG: Whisper transcription failed', [
                    'session_id' => $sessionId,
                    'error' => $whisperResult['error']
                ]);
                return [
                    'success' => false,
                    'error' => 'Whisper transcription failed: ' . $whisperResult['error']
                ];
            }

            // Find speaker details
            $speaker = $this->findSpeakerDetails($sessionData['participants'], $speakerInfo['speaker_id']);

            Log::info('TEMP DEBUG: Speaker details found', [
                'session_id' => $sessionId,
                'speaker_id' => $speakerInfo['speaker_id'],
                'speaker_name' => $speaker['name'] ?? 'Unknown',
                'speaker_color' => $speaker['color'] ?? '#6B7280'
            ]);

            // Update original transcription with Whisper results and speaker info
            $updateData = [
                'whisper_text' => $whisperResult['text'],
                'whisper_confidence' => $whisperResult['confidence'] ?? 0.9,
                'whisper_language' => $whisperResult['language'] ?? 'nl',
                'speaker_id' => $speakerInfo['speaker_id'],
                'speaker_name' => $speaker['name'] ?? 'Onbekende Spreker',
                'speaker_color' => $speaker['color'] ?? '#6B7280',
                'speaker_confidence' => $speakerInfo['confidence'],
                'processing_status' => 'whisper_verified',
                'metadata' => array_merge($originalTranscription->metadata ?? [], [
                    'whisper_processed_at' => now(),
                    'speaker_detection_method' => $speakerInfo['method'],
                    'voice_setup_complete' => $sessionData['voice_setup_complete']
                ])
            ];

            Log::info('TEMP DEBUG: Updating transcription with Whisper results', [
                'session_id' => $sessionId,
                'transcription_id' => $originalTranscription->id,
                'update_data_preview' => [
                    'whisper_text_length' => strlen($updateData['whisper_text']),
                    'speaker_name' => $updateData['speaker_name'],
                    'speaker_confidence' => $updateData['speaker_confidence']
                ]
            ]);

            $originalTranscription->update($updateData);

            Log::info('Whisper verification completed with speaker identification', [
                'session_id' => $sessionId,
                'transcription_id' => $originalTranscription->id,
                'whisper_text_length' => strlen($whisperResult['text']),
                'identified_speaker' => $speakerInfo['speaker_id'],
                'speaker_confidence' => $speakerInfo['confidence']
            ]);

            $responseData = [
                'success' => true,
                'transcription' => [
                    'id' => $originalTranscription->id,
                    'text' => $originalTranscription->whisper_text,
                    'original_text' => $originalTranscription->text,
                    'speaker_name' => $originalTranscription->speaker_name,
                    'speaker_id' => $originalTranscription->speaker_id,
                    'speaker_color' => $originalTranscription->speaker_color,
                    'confidence' => $originalTranscription->whisper_confidence,
                    'speaker_confidence' => $originalTranscription->speaker_confidence,
                    'language' => $originalTranscription->whisper_language,
                    'spoken_at' => $originalTranscription->spoken_at,
                    'processing_status' => $originalTranscription->processing_status,
                    'database_saved' => true
                ],
                'speaker_identification' => $speakerInfo,
                'whisper_processing' => [
                    'text_improved' => $originalTranscription->whisper_text !== $originalTranscription->text,
                    'confidence_improved' => ($whisperResult['confidence'] ?? 0) > $originalTranscription->confidence
                ]
            ];

            Log::info('TEMP DEBUG: Final response data', [
                'session_id' => $sessionId,
                'response_success' => $responseData['success'],
                'response_text_length' => strlen($responseData['transcription']['text']),
                'response_has_speaker' => !empty($responseData['transcription']['speaker_name'])
            ]);

            return $responseData;

        } catch (\Exception $e) {
            Log::error('Whisper verification with speaker identification failed', [
                'session_id' => $sessionId,
                'transcription_id' => $liveTranscriptionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Whisper verification failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Find speaker details from participants array
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
     * Save session data to cache
     */
    private function saveSession(string $sessionId, array $sessionData): void
    {
        Cache::put("live_session_{$sessionId}", $sessionData, now()->addHours(4));
    }

    /**
     * Get session data from cache
     */
    private function getSession(string $sessionId): ?array
    {
        return Cache::get("live_session_{$sessionId}");
    }
}