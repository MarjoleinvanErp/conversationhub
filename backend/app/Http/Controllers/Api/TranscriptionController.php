<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\Transcription;
use App\Services\EnhancedLiveTranscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class TranscriptionController extends Controller
{
    private $enhancedLiveTranscriptionService;

    public function __construct(EnhancedLiveTranscriptionService $enhancedLiveTranscriptionService)
    {
        $this->enhancedLiveTranscriptionService = $enhancedLiveTranscriptionService;
    }

    /**
     * Display a listing of transcriptions for a meeting
     */
    public function index(Meeting $meeting, Request $request): JsonResponse
    {
        try {
            $sourceFilter = $request->query('source');
            $limit = $request->query('limit', 100);

            $query = Transcription::where('meeting_id', $meeting->id);

            if ($sourceFilter) {
                if ($sourceFilter === 'live') {
                    $query->whereIn('source', ['live', 'live_fallback', 'background_live', 'live_verified']);
                } elseif ($sourceFilter === 'whisper') {
                    $query->whereIn('source', ['whisper', 'whisper_verified', 'background_whisper']);
                } else {
                    $query->where('source', $sourceFilter);
                }
            }

            $transcriptions = $query
                ->orderBy('spoken_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($transcription) {
                    // Parse metadata if it exists
                    $metadata = [];
                    if ($transcription->metadata) {
                        $metadata = is_string($transcription->metadata) 
                            ? json_decode($transcription->metadata, true) 
                            : $transcription->metadata;
                    }

                    return [
                        'id' => $transcription->id,
                        'text' => $transcription->text,
                        'speaker_name' => $transcription->speaker_name,
                        'speaker_color' => $transcription->speaker_color,
                        'confidence' => $transcription->confidence,
                        'source' => $transcription->source,
                        'timestamp' => $transcription->spoken_at,
                        'created_at' => $transcription->created_at,
                        'is_final' => $transcription->is_final,
                        'metadata' => $metadata
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $transcriptions,
                'meta' => [
                    'meeting_id' => $meeting->id,
                    'total_count' => count($transcriptions),
                    'source_filter' => $sourceFilter,
                    'fetched_at' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch transcriptions', [
                'meeting_id' => $meeting->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch transcriptions: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Get Whisper transcriptions for a meeting
     */
    public function getWhisperTranscriptions(Meeting $meeting): JsonResponse
    {
        try {
            Log::info('Fetching Whisper transcriptions', [
                'meeting_id' => $meeting->id,
                'meeting_title' => $meeting->title
            ]);

            // Get transcriptions with Whisper source
            $transcriptions = Transcription::where('meeting_id', $meeting->id)
                ->whereIn('source', ['whisper', 'whisper_verified', 'background_whisper'])
                ->orderBy('spoken_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transcription) {
                    // Parse metadata if it exists
                    $metadata = [];
                    if ($transcription->metadata) {
                        $metadata = is_string($transcription->metadata) 
                            ? json_decode($transcription->metadata, true) 
                            : $transcription->metadata;
                    }

                    return [
                        'id' => $transcription->id,
                        'text' => $transcription->text,
                        'speaker_name' => $transcription->speaker_name,
                        'speaker_color' => $transcription->speaker_color,
                        'confidence' => $transcription->confidence,
                        'source' => $transcription->source,
                        'timestamp' => $transcription->spoken_at,
                        'created_at' => $transcription->created_at,
                        'is_final' => $transcription->is_final,
                        'database_saved' => true, // All records from DB are saved
                        'processing_status' => 'completed',
                        'metadata' => $metadata
                    ];
                })
                ->toArray();

            Log::info('Whisper transcriptions retrieved', [
                'meeting_id' => $meeting->id,
                'count' => count($transcriptions)
            ]);

            return response()->json([
                'success' => true,
                'data' => $transcriptions,
                'meta' => [
                    'meeting_id' => $meeting->id,
                    'total_count' => count($transcriptions),
                    'fetched_at' => now()->toISOString(),
                    'source_filter' => ['whisper', 'whisper_verified', 'background_whisper']
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch Whisper transcriptions', [
                'meeting_id' => $meeting->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch Whisper transcriptions: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Store a newly created transcription
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'meeting_id' => 'required|exists:meetings,id',
                'text' => 'required|string',
                'speaker_name' => 'sometimes|string|max:255',
                'speaker_color' => 'sometimes|string|max:7',
                'confidence' => 'sometimes|numeric|between:0,1',
                'source' => 'sometimes|string|max:50',
                'spoken_at' => 'sometimes|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $transcription = Transcription::create([
                'meeting_id' => $request->meeting_id,
                'text' => $request->text,
                'speaker_name' => $request->speaker_name,
                'speaker_color' => $request->speaker_color,
                'confidence' => $request->confidence ?? 0.8,
                'source' => $request->source ?? 'manual',
                'is_final' => true,
                'spoken_at' => $request->spoken_at ?? now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $transcription,
                'message' => 'Transcription created successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create transcription', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create transcription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified transcription
     */
    public function show(Transcription $transcription): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $transcription
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch transcription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified transcription
     */
    public function update(Request $request, Transcription $transcription): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'text' => 'sometimes|string',
                'speaker_name' => 'sometimes|string|max:255',
                'speaker_color' => 'sometimes|string|max:7',
                'confidence' => 'sometimes|numeric|between:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $transcription->update($request->only([
                'text', 'speaker_name', 'speaker_color', 'confidence'
            ]));

            return response()->json([
                'success' => true,
                'data' => $transcription,
                'message' => 'Transcription updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update transcription', [
                'transcription_id' => $transcription->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to update transcription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified transcription
     */
    public function destroy(Transcription $transcription): JsonResponse
    {
        try {
            $transcription->delete();

            return response()->json([
                'success' => true,
                'message' => 'Transcription deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete transcription', [
                'transcription_id' => $transcription->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to delete transcription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple transcriptions by type
     */
    public function deleteTranscriptions(Meeting $meeting, Request $request, $type = null): JsonResponse
    {
        try {
            $query = Transcription::where('meeting_id', $meeting->id);

            if ($type) {
                if ($type === 'live') {
                    $query->whereIn('source', ['live', 'live_fallback', 'background_live', 'live_verified']);
                } elseif ($type === 'whisper') {
                    $query->whereIn('source', ['whisper', 'whisper_verified', 'background_whisper']);
                } else {
                    $query->where('source', $type);
                }
            }

            $deletedCount = $query->delete();

            return response()->json([
                'success' => true,
                'deleted_count' => $deletedCount,
                'message' => "Deleted {$deletedCount} transcriptions"
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete transcriptions', [
                'meeting_id' => $meeting->id,
                'type' => $type,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to delete transcriptions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete single transcription
     */
    public function deleteTranscription(Transcription $transcription): JsonResponse
    {
        return $this->destroy($transcription);
    }
}