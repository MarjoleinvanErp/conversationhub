<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnhancedLiveTranscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class LiveTranscriptionController extends Controller
{
    private $liveTranscriptionService;

    public function __construct(EnhancedLiveTranscriptionService $liveTranscriptionService)
    {
        $this->liveTranscriptionService = $liveTranscriptionService;
    }

    /**
     * Start enhanced session
     */
    public function startEnhancedSession(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'meeting_id' => 'required|integer|exists:meetings,id',
            'participants' => 'array',
            'participants.*.id' => 'required|string',
            'participants.*.name' => 'required|string',
            'participants.*.color' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->liveTranscriptionService->startEnhancedSession(
            $request->meeting_id,
            $request->participants ?? []
        );

        return response()->json($result);
    }

    /**
     * Setup voice profile
     */
    public function setupVoiceProfile(Request $request): JsonResponse
    {
        try {
            Log::info('Voice profile setup request received', [
                'session_id' => $request->input('session_id'),
                'speaker_id' => $request->input('speaker_id'),
                'has_voice_sample' => $request->hasFile('voice_sample'),
            ]);

            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'speaker_id' => 'required|string',
                'voice_sample' => 'required|file|mimes:webm,wav,mp3,m4a|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $audioContent = file_get_contents($request->file('voice_sample')->getPathname());

            $result = $this->liveTranscriptionService->setupVoiceProfile(
                $request->session_id,
                $request->speaker_id,
                $audioContent
            );

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Voice profile setup exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Voice profile setup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process live transcription - FIXED for N8N and 90-second chunks
     */
    public function processLive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'sometimes|string',
                'live_text' => 'required|string',
                'confidence' => 'sometimes|numeric|between:0,1',
                'audio_data' => 'sometimes|string', // For N8N processing
                'preferred_service' => 'sometimes|string|in:auto,whisper,n8n',
                'use_n8n' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Processing live transcription', [
                'session_id' => $request->session_id,
                'text_length' => strlen($request->live_text),
                'confidence' => $request->confidence,
                'preferred_service' => $request->preferred_service,
                'use_n8n' => $request->use_n8n
            ]);

            // FIXED: Create options array for enhanced processing
            $options = [
                'session_id' => $request->session_id,
                'preferred_service' => $request->preferred_service ?? 'auto',
                'use_n8n' => $request->use_n8n ?? false,
                'audio_data' => $request->audio_data,
            ];

            // FIXED: Use the correct method signature with options
            $result = $this->liveTranscriptionService->processLiveTranscription(
                $request->live_text,
                $request->confidence ?? 0.8,
                $options  // Pass options array
            );

            if ($result['success']) {
                Log::info('Live transcription processed successfully', [
                    'session_id' => $request->session_id,
                    'transcription_id' => $result['transcription']['id'] ?? 'unknown',
                    'service_used' => $result['processing_details']['service_used'] ?? 'unknown'
                ]);
            } else {
                Log::warning('Live transcription processing failed', [
                    'session_id' => $request->session_id,
                    'error' => $result['error']
                ]);
            }

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Live transcription exception', [
                'session_id' => $request->input('session_id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Live transcription failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process Whisper verification for 90-second chunks - FIXED
     */
    public function verifyWithWhisper(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'sometimes|string',
                'transcription_id' => 'sometimes|string', // Made optional
                'audio_data' => 'required|string', // Base64 encoded audio
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Whisper verification request', [
                'session_id' => $request->session_id,
                'transcription_id' => $request->transcription_id,
                'audio_data_length' => strlen($request->audio_data)
            ]);

            // Decode base64 audio data
            $audioContent = base64_decode($request->audio_data);

            if (!$audioContent) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid audio data provided'
                ], 400);
            }

            // FIXED: Use processWhisperVerification method
            $result = $this->liveTranscriptionService->processWhisperVerification(
                $request->transcription_id ?? 'chunk_' . time(),
                $audioContent
            );

            if ($result['success']) {
                Log::info('Whisper verification completed', [
                    'session_id' => $request->session_id,
                    'transcription_id' => $result['transcription']['id'] ?? 'unknown',
                    'chunk_processed' => true
                ]);
            } else {
                Log::warning('Whisper verification failed', [
                    'session_id' => $request->session_id,
                    'error' => $result['error']
                ]);
            }

            return response()->json($result);

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

    /**
     * NEW: Process audio chunk for N8N transcription (90-second chunks)
     */
    public function processAudioChunk(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'audio_data' => 'required|string', // Base64 encoded
                'chunk_number' => 'sometimes|integer',
                'timestamp' => 'sometimes|string',
                'preferred_service' => 'sometimes|string|in:auto,whisper,n8n',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Processing 90-second audio chunk', [
                'session_id' => $request->session_id,
                'chunk_number' => $request->chunk_number,
                'audio_size' => strlen($request->audio_data),
                'preferred_service' => $request->preferred_service ?? 'auto'
            ]);

            // Decode audio data
            $audioContent = base64_decode($request->audio_data);

            if (!$audioContent) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid audio data provided'
                ], 400);
            }

            $options = [
                'session_id' => $request->session_id,
                'chunk_number' => $request->chunk_number ?? 1,
                'timestamp' => $request->timestamp ?? now()->toISOString(),
                'preferred_service' => $request->preferred_service ?? 'auto',
                'use_n8n' => $request->preferred_service === 'n8n',
                'source' => 'audio_chunk_90s'
            ];

            // Process based on preferred service
            if ($options['preferred_service'] === 'n8n' || $options['use_n8n']) {
                // Send to N8N workflow for processing
                $result = $this->liveTranscriptionService->processWithN8N($audioContent, $options);
            } else {
                // Use Whisper for transcription
                $transcriptionId = 'chunk_' . $request->session_id . '_' . ($request->chunk_number ?? time());
                $result = $this->liveTranscriptionService->processWhisperVerification($transcriptionId, $audioContent);
            }

            if ($result['success']) {
                Log::info('Audio chunk processed successfully', [
                    'session_id' => $request->session_id,
                    'chunk_number' => $request->chunk_number,
                    'service_used' => $options['preferred_service'],
                    'transcription_length' => strlen($result['transcription']['text'] ?? '')
                ]);
            }

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Audio chunk processing failed', [
                'session_id' => $request->input('session_id'),
                'chunk_number' => $request->input('chunk_number'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Audio chunk processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session statistics and status
     */
    public function getSessionStats(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $stats = $this->liveTranscriptionService->getSessionStats($request->session_id);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get session stats', [
                'session_id' => $request->input('session_id'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get session stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * End enhanced session
     */
    public function endSession(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Ending enhanced session', [
                'session_id' => $request->session_id
            ]);

            $result = $this->liveTranscriptionService->endSession($request->session_id);

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Failed to end session', [
                'session_id' => $request->input('session_id'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to end session: ' . $e->getMessage()
            ], 500);
        }
    }
}