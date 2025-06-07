<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\Meeting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ParticipantController extends Controller
{
    /**
     * Display a listing of participants for a meeting
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

            $participants = $meeting->participants;

            return response()->json([
                'success' => true,
                'data' => $participants
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen deelnemers: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created participant
     */
    public function store(Request $request, $meetingId): JsonResponse
    {
        // TODO: Implement participant creation
        return response()->json([
            'success' => false,
            'message' => 'Participant creation not implemented yet'
        ], 501);
    }

    /**
     * Display the specified participant
     */
    public function show(Request $request, $meetingId, $participantId): JsonResponse
    {
        // TODO: Implement participant show
        return response()->json([
            'success' => false,
            'message' => 'Participant show not implemented yet'
        ], 501);
    }

    /**
     * Update the specified participant
     */
    public function update(Request $request, $meetingId, $participantId): JsonResponse
    {
        // TODO: Implement participant update
        return response()->json([
            'success' => false,
            'message' => 'Participant update not implemented yet'
        ], 501);
    }

    /**
     * Remove the specified participant
     */
    public function destroy(Request $request, $meetingId, $participantId): JsonResponse
    {
        // TODO: Implement participant deletion
        return response()->json([
            'success' => false,
            'message' => 'Participant deletion not implemented yet'
        ], 501);
    }
}