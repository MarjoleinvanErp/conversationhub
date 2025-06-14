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

            $agendaItems = AgendaItem::where('meeting_id', $meetingId)
                ->orderBy('order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $agendaItems
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching agenda items: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen agenda items'
            ], 500);
        }
    }

    public function updateStatus(Request $request, $meetingId, $agendaItemId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:pending,active,completed,skipped',
                'completed' => 'sometimes|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            $agendaItem = AgendaItem::where('id', $agendaItemId)
                ->where('meeting_id', $meetingId)
                ->first();

            if (!$agendaItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Agenda item niet gevonden'
                ], 404);
            }

            $status = $request->status;
            
            if ($request->has('completed')) {
                $status = $request->completed ? 'completed' : 'pending';
            }

            $agendaItem->status = $status;
            
            if ($status === 'completed') {
                $agendaItem->completed_at = now();
            } else {
                $agendaItem->completed_at = null;
            }

            $agendaItem->save();

            $responseData = $agendaItem->toArray();
            $responseData['completed'] = ($agendaItem->status === 'completed');

            return response()->json([
                'success' => true,
                'message' => 'Agenda item status bijgewerkt',
                'data' => $responseData
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating agenda item status: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij bijwerken agenda item status'
            ], 500);
        }
    }

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

            $meeting = Meeting::where('id', $meetingId)
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meeting niet gevonden'
                ], 404);
            }

            $nextOrder = AgendaItem::where('meeting_id', $meetingId)
                ->max('order') + 1;

            $agendaItem = AgendaItem::create([
                'meeting_id' => $meetingId,
                'title' => $request->title,
                'description' => $request->description,
                'estimated_duration' => $request->estimated_duration,
                'order' => $nextOrder ?? 1,
                'status' => 'pending',
            ]);

            $responseData = $agendaItem->toArray();
            $responseData['completed'] = false;

            return response()->json([
                'success' => true,
                'message' => 'Agenda item toegevoegd',
                'data' => $responseData
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error adding agenda item: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij toevoegen agenda item'
            ], 500);
        }
    }

    public function destroy(Request $request, $meetingId, $agendaItemId): JsonResponse
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
            \Log::error('Error deleting agenda item: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij verwijderen agenda item'
            ], 500);
        }
    }
}