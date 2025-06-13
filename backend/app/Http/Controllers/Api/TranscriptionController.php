<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\Transcription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class TranscriptionController extends Controller
{
    /**
     * Get all transcriptions for a meeting
     */
    public function index(Request $request, $meetingId): JsonResponse
    {
        try {
            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            $transcriptions = Transcription::where('meeting_id', $meetingId)
                ->orderBy('spoken_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transcriptions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen transcripties: ' . $e->getMessage()
            ], 500);
        }
    }

/**
 * Delete transcriptions by type
 */
public function deleteTranscriptions(Request $request, Meeting $meeting, $type = null)
{
    try {
        $query = $meeting->transcriptions();
        
        if ($type) {
            $validTypes = ['live', 'whisper', 'speech', 'upload'];
            if (!in_array($type, $validTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid transcription type'
                ], 400);
            }
            
            $query->where('source', $type);
        }
        
        $deletedCount = $query->delete();
        
        return response()->json([
            'success' => true,
            'message' => "Deleted {$deletedCount} transcriptions",
            'deleted_count' => $deletedCount
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to delete transcriptions: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Delete single transcription
 */
public function deleteTranscription(Transcription $transcription)
{
    try {
        $transcription->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Transcription deleted successfully'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to delete transcription: ' . $e->getMessage()
        ], 500);
    }
}


/**
 * Store a new transcription
 */
public function store(Request $request): JsonResponse
{
    try {
        Log::info('Transcription store request', [
            'data' => $request->all(),
        ]);

        $validator = Validator::make($request->all(), [
            'meeting_id' => 'required|integer|exists:meetings,id',
            'speaker_name' => 'required|string|max:255',
            'speaker_id' => 'nullable|string|max:255',
            'speaker_color' => 'nullable|string|max:7',
            'text' => 'required|string',
            'confidence' => 'nullable|numeric|between:0,1',
            'source' => 'nullable|in:live,upload,manual',
            'is_final' => 'nullable|boolean',
            'spoken_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            Log::error('Transcription validation failed', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify user owns the meeting
        $meeting = Meeting::where('id', $request->meeting_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$meeting) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting niet gevonden'
            ], 404);
        }

        $transcription = Transcription::create([
            'meeting_id' => $request->meeting_id,
            'speaker_name' => $request->speaker_name,
            'speaker_id' => $request->speaker_id,
            'speaker_color' => $request->speaker_color ?? '#6B7280',
            'text' => $request->text,
            'confidence' => $request->confidence ?? 0.8,
            'source' => $request->source ?? 'upload', // Changed from 'live' to 'upload'
            'is_final' => $request->is_final ?? true,
            'spoken_at' => $request->spoken_at ?? now(),
        ]);

        Log::info('Transcription saved successfully', [
            'transcription_id' => $transcription->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transcriptie opgeslagen',
            'data' => $transcription
        ], 201);

    } catch (\Exception $e) {
        Log::error('Transcription store exception', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Fout bij opslaan transcriptie: ' . $e->getMessage()
        ], 500);
    }
}
    /**
     * Get a specific transcription
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $transcription = Transcription::with('meeting')
                ->find($id);

            if (!$transcription) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transcriptie niet gevonden'
                ], 404);
            }

            // Check if user owns the meeting
            if ($transcription->meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze transcriptie'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $transcription
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen transcriptie: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update transcription
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $transcription = Transcription::with('meeting')->find($id);

            if (!$transcription) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transcriptie niet gevonden'
                ], 404);
            }

            // Check if user owns the meeting
            if ($transcription->meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze transcriptie'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'speaker_name' => 'sometimes|string|max:255',
                'speaker_id' => 'sometimes|nullable|string|max:255',
                'speaker_color' => 'sometimes|nullable|string|max:7',
                'text' => 'sometimes|string',
                'confidence' => 'sometimes|numeric|between:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transcription->update($request->only([
                'speaker_name', 'speaker_id', 'speaker_color', 'text', 'confidence'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Transcriptie bijgewerkt',
                'data' => $transcription
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij bijwerken transcriptie: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete transcription
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $transcription = Transcription::with('meeting')->find($id);

            if (!$transcription) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transcriptie niet gevonden'
                ], 404);
            }

            // Check if user owns the meeting
            if ($transcription->meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze transcriptie'
                ], 403);
            }

            $transcription->delete();

            return response()->json([
                'success' => true,
                'message' => 'Transcriptie verwijderd'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij verwijderen transcriptie: ' . $e->getMessage()
            ], 500);
        }
    }
}