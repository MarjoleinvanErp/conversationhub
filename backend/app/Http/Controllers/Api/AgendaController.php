<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgendaItem;
use App\Models\Meeting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AgendaController extends Controller
{
    /**
     * Update agenda item status
     */
    public function updateStatus(Request $request, $meetingId, $agendaItemId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:pending,completed,in_progress',
                'completed' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify meeting belongs to user
            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            // Find agenda item
            $agendaItem = AgendaItem::where('id', $agendaItemId)
                ->where('meeting_id', $meetingId)
                ->first();

            if (!$agendaItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agenda item niet gevonden'
                ], 404);
            }

            // Update status
            $agendaItem->status = $request->status;
            
            // Update completed field if provided
            if ($request->has('completed')) {
                $agendaItem->completed = $request->completed;
            } else {
                // Auto-set completed based on status
                $agendaItem->completed = ($request->status === 'completed');
            }

            $agendaItem->save();

            return response()->json([
                'success' => true,
                'message' => 'Agenda item status bijgewerkt',
                'data' => $agendaItem
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating agenda item status: ' . $e->getMessage(), [
                'meetingId' => $meetingId,
                'agendaItemId' => $agendaItemId,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij bijwerken agenda item status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get agenda items for a meeting
     */
    public function index(Request $request, $meetingId): JsonResponse
    {
        try {
            // Verify meeting belongs to user
            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            $agendaItems = AgendaItem::where('meeting_id', $meetingId)
                ->orderBy('order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $agendaItems
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching agenda items: ' . $e->getMessage(), [
                'meetingId' => $meetingId,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen agenda items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add agenda item to meeting
     */
    public function store(Request $request, $meetingId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'estimated_duration' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify meeting belongs to user
            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            // Get next order number
            $nextOrder = AgendaItem::where('meeting_id', $meetingId)
                ->max('order') + 1;

            $agendaItem = AgendaItem::create([
                'meeting_id' => $meetingId,
                'title' => $request->title,
                'description' => $request->description,
                'estimated_duration' => $request->estimated_duration,
                'order' => $nextOrder ?? 1,
                'status' => 'pending',
                'completed' => false
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Agenda item toegevoegd',
                'data' => $agendaItem
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error adding agenda item: ' . $e->getMessage(), [
                'meetingId' => $meetingId,
                'user_id' => $request->user()->id ?? null,
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij toevoegen agenda item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete agenda item
     */
    public function destroy(Request $request, $meetingId, $agendaItemId): JsonResponse
    {
        try {
            // Verify meeting belongs to user
            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            // Find and delete agenda item
            $agendaItem = AgendaItem::where('id', $agendaItemId)
                ->where('meeting_id', $meetingId)
                ->first();

            if (!$agendaItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agenda item niet gevonden'
                ], 404);
            }

            $agendaItem->delete();

            return response()->json([
                'success' => true,
                'message' => 'Agenda item verwijderd'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting agenda item: ' . $e->getMessage(), [
                'meetingId' => $meetingId,
                'agendaItemId' => $agendaItemId,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij verwijderen agenda item: ' . $e->getMessage()
            ], 500);
        }
    }
}