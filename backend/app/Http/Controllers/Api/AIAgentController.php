<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AIAgentController extends Controller
{
    /**
     * Get meeting data for AI Agent
     */
    public function getMeetingData(Request $request): JsonResponse
    {
        try {
            $meetingId = $request->input('meeting_id');
            
            if (!$meetingId) {
                return response()->json(['error' => 'meeting_id is required'], 400);
            }
            
            $meeting = DB::table('meetings')
                ->select('id', 'title', 'description', 'scheduled_at', 'duration_minutes')
                ->where('id', $meetingId)
                ->first();
                
            if (!$meeting) {
                return response()->json(['error' => 'Meeting not found'], 404);
            }
            
            $agendaItems = DB::table('agenda_items')
                ->select('id', 'title', 'description', 'order', 'status', 'estimated_duration')
                ->where('meeting_id', $meetingId)
                ->orderBy('order')
                ->get();
                
            return response()->json([
                'success' => true,
                'meeting' => $meeting,
                'agenda_items' => $agendaItems->toArray()
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI Agent getMeetingData error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch meeting data: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get transcriptions for AI Agent
     */
    public function getTranscriptions(Request $request): JsonResponse
    {
        try {
            $meetingId = $request->input('meeting_id');
            
            if (!$meetingId) {
                return response()->json(['error' => 'meeting_id is required'], 400);
            }
            
            $transcriptions = DB::table('transcriptions')
                ->select('id', 'text', 'speaker_name', 'speaker_color', 'confidence', 'spoken_at', 'metadata')
                ->where('meeting_id', $meetingId)
                ->orderBy('spoken_at')
                ->get();
                
            return response()->json([
                'success' => true,
                'transcriptions' => $transcriptions->toArray(),
                'count' => $transcriptions->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI Agent getTranscriptions error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch transcriptions: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get participants for AI Agent
     */
    public function getParticipants(Request $request): JsonResponse
    {
        try {
            $meetingId = $request->input('meeting_id');
            
            if (!$meetingId) {
                return response()->json(['error' => 'meeting_id is required'], 400);
            }
            
            $participants = DB::table('participants')
                ->select('id', 'name', 'email', 'role', 'consent_given')
                ->where('meeting_id', $meetingId)
                ->orderBy('name')
                ->get();
                
            return response()->json([
                'success' => true,
                'participants' => $participants->toArray(),
                'count' => $participants->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI Agent getParticipants error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch participants: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Update agenda item status
     */
    public function updateAgendaStatus(Request $request): JsonResponse
    {
        try {
            $agendaId = $request->input('agenda_id');
            $status = $request->input('status', 'completed');
            
            if (!$agendaId) {
                return response()->json(['error' => 'agenda_id is required'], 400);
            }
            
            $updated = DB::table('agenda_items')
                ->where('id', $agendaId)
                ->update([
                    'status' => $status,
                    'completed_at' => now(),
                    'updated_at' => now()
                ]);
                
            return response()->json([
                'success' => $updated > 0,
                'updated_count' => $updated,
                'agenda_id' => $agendaId,
                'new_status' => $status
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI Agent updateAgendaStatus error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update agenda status: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Save AI generated report
     */
    public function saveReport(Request $request): JsonResponse
    {
        try {
            $meetingId = $request->input('meeting_id');
            $title = $request->input('title');
            $content = $request->input('content');
            $metadata = $request->input('metadata', []);
            
            if (!$meetingId) {
                return response()->json(['error' => 'meeting_id is required'], 400);
            }
            
            if (!$title) {
                return response()->json(['error' => 'title is required'], 400);
            }
            
            $reportId = DB::table('meeting_reports')->insertGetId([
                'meeting_id' => $meetingId,
                'report_title' => $title,
                'report_content' => $content ?: 'Generated by AI Agent',
                'report_type' => 'ai_agent_generated',
                'generated_by' => 'N8N_AI_Agent',
                'generated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
                'metadata' => json_encode($metadata)
            ]);
            
            return response()->json([
                'success' => true,
                'report_id' => $reportId,
                'meeting_id' => $meetingId
            ]);
            
        } catch (\Exception $e) {
            Log::error('AI Agent saveReport error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save report: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Health check for AI Agent endpoints
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'service' => 'AI Agent Controller',
            'timestamp' => now()->toISOString()
        ]);
    }
}