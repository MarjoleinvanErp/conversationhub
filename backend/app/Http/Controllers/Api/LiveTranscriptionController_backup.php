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
     * Process live transcription met audio sample voor speaker detection
     */
    public function processLive(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'live_text' => 'required|string',
                'confidence' => 'sometimes|numeric|between:0,1',
                'audio_sample' => 'sometimes|file|mimes:webm,wav,mp3,m4a|max:5120', // 5MB max for small samples
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Processing live transcription with speaker detection', [
                'session_id' => $request->session_id,
                'text_length' => strlen($request->live_text),
                'confidence' => $request->confidence,
                'has_audio_sample' => $request->hasFile('audio_sample')
            ]);

            // Get audio sample voor speaker detection
            $audioSample = null;
            if ($request->hasFile('audio_sample')) {
                $audioSample = file_get_contents($request->file('audio_sample')->getPathname());
                Log::info('Audio sample received for speaker detection', [
                    'session_id' => $request->session_id,
                    'audio_size' => strlen($audioSample)
                ]);
            }

            // Process with speaker detection
            $result = $this->liveTranscriptionService->processLiveTranscription(
                $request->session_id,
                $request->live_text,
                $audioSample, // Audio sample voor speaker detection
                $request->confidence ?? 0.8
            );

            if ($result['success']) {
                Log::info('Live transcription processed successfully with speaker detection', [
                    'session_id' => $request->session_id,
                    'transcription_id' => $result['transcription']['id'],
                    'identified_speaker' => $result['speaker_identification']['speaker_id'] ?? 'unknown',
                    'speaker_confidence' => $result['speaker_identification']['confidence'] ?? 0.0
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
     * Process Whisper verification met speaker identification
     */
    public function verifyWithWhisper(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'session_id' => 'required|string',
                'live_transcription_id' => 'required|string',
                'audio_chunk' => 'required|file|mimes:webm,wav,mp3,m4a|max:25600', // 25MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Whisper verification request', [
                'session_id' => $request->session_id,
                'live_transcription_id' => $request->live_transcription_id,
                'chunk_size' => $request->file('audio_chunk')->getSize()
            ]);

            $audioContent = file_get_contents($request->file('audio_chunk')->getPathname());

            // Process with speaker identification
            $result = $this->liveTranscriptionService->processWhisperVerification(
                $request->session_id,
                $request->live_transcription_id,
                $audioContent
            );

            if ($result['success']) {
                Log::info('Whisper verification completed', [
                    'session_id' => $request->session_id,
                    'transcription_id' => $result['transcription']['id'],
                    'identified_speaker' => $result['speaker_identification']['speaker_id'] ?? 'unknown',
                    'speaker_confidence' => $result['speaker_identification']['confidence'] ?? 0.0
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
}