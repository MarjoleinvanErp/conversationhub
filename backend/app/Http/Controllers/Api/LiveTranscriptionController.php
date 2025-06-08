<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnhancedLiveTranscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;  // ← DEZE REGEL TOEVOEGEN

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
                'file_size' => $request->hasFile('voice_sample') ? $request->file('voice_sample')->getSize() : 0,
            ]);

            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'speaker_id' => 'required|string',
                'voice_sample' => 'required|file|mimes:webm,wav,mp3|max:2048',
            ]);

            if ($validator->fails()) {
                Log::warning('Voice profile validation failed', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $voiceSample = file_get_contents($request->file('voice_sample')->getPathname());

            Log::info('Processing voice profile', [
                'session_id' => $request->session_id,
                'speaker_id' => $request->speaker_id,
                'voice_sample_size' => strlen($voiceSample),
            ]);

            $result = $this->liveTranscriptionService->setupVoiceProfile(
                $request->session_id,
                $request->speaker_id,
                $voiceSample
            );

            Log::info('Voice profile setup completed', [
                'session_id' => $request->session_id,
                'speaker_id' => $request->speaker_id,
                'result' => $result,
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Voice profile setup exception', [
                'session_id' => $request->input('session_id'),
                'speaker_id' => $request->input('speaker_id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
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
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|string',
            'live_text' => 'required|string',
            'confidence' => 'nullable|numeric|between:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->liveTranscriptionService->processLiveTranscription(
            $request->session_id,
            $request->live_text,
            null, // audio sample for speaker detection - can be added later
            $request->confidence ?? 0.8
        );

        return response()->json($result);
    }

    /**
     * Verify with Whisper
     */
    public function verifyWithWhisper(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|string',
            'live_transcription_id' => 'required|string',
            'audio_chunk' => 'required|file|mimes:webm,wav,mp3|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $audioChunk = file_get_contents($request->file('audio_chunk')->getPathname());

        $result = $this->liveTranscriptionService->processWhisperVerification(
            $request->session_id,
            $request->live_transcription_id,
            $audioChunk
        );

        return response()->json($result);
    }
}