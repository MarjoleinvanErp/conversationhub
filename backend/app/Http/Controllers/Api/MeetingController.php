<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class MeetingController extends Controller
{
    /**
     * Get all meetings for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $meetings = Meeting::where('user_id', $request->user()->id)
                ->with(['participants', 'agendaItems'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $meetings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen gesprekken: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new meeting
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:general,participation,care,education',
                'scheduled_at' => 'nullable|date',
                'duration_minutes' => 'integer|min:15|max:480',
                'privacy_level' => 'in:minimal,standard,detailed',
                'participants' => 'array',
                'participants.*.name' => 'required|string|max:255',
                'participants.*.email' => 'nullable|email',
                'participants.*.role' => 'in:participant,facilitator,observer',
                'agenda_items' => 'array',
                'agenda_items.*.title' => 'required|string|max:255',
                'agenda_items.*.description' => 'nullable|string',
                'agenda_items.*.estimated_duration' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $meeting = Meeting::create([
                'title' => $request->title,
                'description' => $request->description,
                'type' => $request->type,
                'scheduled_at' => $request->scheduled_at,
                'duration_minutes' => $request->duration_minutes ?? 60,
                'privacy_level' => $request->privacy_level ?? 'standard',
                'auto_transcription' => $request->auto_transcription ?? true,
                'user_id' => $request->user()->id,
                'status' => 'scheduled',
            ]);

            // Add participants
            if ($request->has('participants')) {
                foreach ($request->participants as $participantData) {
                    $meeting->participants()->create([
                        'name' => $participantData['name'],
                        'email' => $participantData['email'] ?? null,
                        'role' => $participantData['role'] ?? 'participant',
                    ]);
                }
            }

            // Add agenda items
            if ($request->has('agenda_items')) {
                foreach ($request->agenda_items as $index => $agendaData) {
                    $meeting->agendaItems()->create([
                        'title' => $agendaData['title'],
                        'description' => $agendaData['description'] ?? null,
                        'estimated_duration' => $agendaData['estimated_duration'] ?? null,
                        'order' => $index + 1,
                    ]);
                }
            }

            // Load relationships
            $meeting->load(['participants', 'agendaItems']);

            return response()->json([
                'success' => true,
                'message' => 'Meeting created successfully',
                'data' => $meeting
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij aanmaken gesprek: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific meeting
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $meeting = Meeting::with(['participants', 'agendaItems'])
                ->where('id', $id)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gesprek niet gevonden'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $meeting
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen gesprek: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start a meeting
     */
    public function start(Request $request, $id): JsonResponse
    {
        try {
            $meeting = Meeting::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gesprek niet gevonden'
                ], 404);
            }

            $meeting->update([
                'status' => 'active',
                'scheduled_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gesprek gestart',
                'data' => $meeting
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij starten gesprek: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stop a meeting
     */
    public function stop(Request $request, $id): JsonResponse
    {
        try {
            $meeting = Meeting::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gesprek niet gevonden'
                ], 404);
            }

            $meeting->update([
                'status' => 'completed'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gesprek beëindigd',
                'data' => $meeting
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij beëindigen gesprek: ' . $e->getMessage()
            ], 500);
        }
    }
}