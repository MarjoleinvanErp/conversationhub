<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnhancedLiveTranscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class LiveTranscriptionController extends Controller
{
    private $enhancedLiveTranscriptionService;

    public function __construct(EnhancedLiveTranscriptionService $enhancedLiveTranscriptionService)
    {
        $this->enhancedLiveTranscriptionService = $enhancedLiveTranscriptionService;
    }

    /**
     * Start enhanced transcription session
     */
    public function startEnhancedSession(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'meeting_id' => 'required|integer|exists:meetings,id',
                'participants' => 'required|array',
                'participants.*.id' => 'required|string',
                'participants.*.name' => 'required|string',
                'participants.*.color' => 'sometimes|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $meetingId = $request->input('meeting_id');
            $participants = $request->input('participants');

            Log::info('Starting enhanced transcription session', [
                'meeting_id' => $meetingId,
                'participants_count' => count($participants),
                'user_id' => $request->user()->id
            ]);

            $result = $this->enhancedLiveTranscriptionService->startEnhancedSession(
                $meetingId,
                $participants
            );

            if ($result['success']) {
                Log::info('Enhanced session started successfully', [
                    'session_id' => $result['session_id'],
                    'meeting_id' => $meetingId
                ]);

                return response()->json([
                    'success' => true,
                    'session_id' => $result['session_id'],
                    'participants' => $result['participants'],
                    'message' => 'Enhanced transcription session started'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('Enhanced session start failed', [
                'meeting_id' => $request->input('meeting_id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to start enhanced session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Setup voice profile for speaker
     */
    public function setupVoiceProfile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'speaker_id' => 'required|string',
                'voice_sample' => 'required|file|mimes:webm,wav,mp3,m4a|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $sessionId = $request->input('session_id');
            $speakerId = $request->input('speaker_id');
            $voiceSample = $request->file('voice_sample');

            Log::info('Voice profile setup request', [
                'session_id' => $sessionId,
                'speaker_id' => $speakerId,
                'sample_size' => $voiceSample->getSize()
            ]);

            // Get voice sample content
            $voiceContent = file_get_contents($voiceSample->getPathname());

            $result = $this->enhancedLiveTranscriptionService->setupVoiceProfile(
                $sessionId,
                $speakerId,
                $voiceContent
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'speaker_id' => $speakerId,
                    'voice_profile' => $result['voice_profile'],
                    'message' => 'Voice profile setup successful'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('Voice profile setup failed', [
                'session_id' => $request->input('session_id'),
                'speaker_id' => $request->input('speaker_id'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Voice profile setup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process live transcription
     */
    public function processLive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'live_text' => 'required|string|max:1000',
                'confidence' => 'sometimes|numeric|between:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $sessionId = $request->input('session_id');
            $liveText = $request->input('live_text');
            $confidence = $request->input('confidence', 0.8);

            $result = $this->enhancedLiveTranscriptionService->processLiveTranscription(
                $liveText,
                $confidence
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'transcription' => $result['transcription'],
                    'speaker_detection' => $result['speaker_detection'],
                    'session_stats' => $result['session_stats']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('Live transcription processing failed', [
                'session_id' => $request->input('session_id'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Live transcription processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify transcription with Whisper and save to database
     */
    public function verifyWithWhisper(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'live_transcription_id' => 'required|string',
                'audio_chunk' => 'required|file|mimes:webm,wav,mp3,m4a|max:10240', // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $sessionId = $request->input('session_id');
            $liveTranscriptionId = $request->input('live_transcription_id');
            $audioChunk = $request->file('audio_chunk');

            Log::info('Whisper verification request', [
                'session_id' => $sessionId,
                'live_transcription_id' => $liveTranscriptionId,
                'chunk_size' => $audioChunk->getSize(),
                'chunk_type' => $audioChunk->getMimeType()
            ]);

            // Get audio chunk content
            $audioContent = file_get_contents($audioChunk->getPathname());

            // Process with enhanced service
            $result = $this->enhancedLiveTranscriptionService->processWhisperVerification(
                $liveTranscriptionId,
                $audioContent
            );

            if ($result['success']) {
                Log::info('Whisper verification successful', [
                    'transcription_id' => $result['transcription']['id'],
                    'text_preview' => substr($result['transcription']['text'], 0, 50) . '...',
                    'database_saved' => $result['transcription']['database_saved'] ?? false
                ]);

                return response()->json([
                    'success' => true,
                    'transcription' => $result['transcription'],
                    'whisper_result' => $result['whisper_result'] ?? null,
                    'meta' => [
                        'processed_at' => now()->toISOString(),
                        'processing_method' => 'whisper_verification'
                    ]
                ]);
            } else {
                Log::warning('Whisper verification failed', [
                    'session_id' => $sessionId,
                    'live_transcription_id' => $liveTranscriptionId,
                    'error' => $result['error']
                ]);

                return response()->json([
                    'success' => false,
                    'error' => $result['error'],
                    'fallback_available' => true
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('Whisper verification exception', [
                'session_id' => $request->input('session_id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Whisper verification failed: ' . $e->getMessage()
            ], 500);
        }
    }
}