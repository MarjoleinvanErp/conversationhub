<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MeetingReportController extends Controller
{
    /**
     * Get meeting report by meeting ID
     */
    public function getMeetingReport($meetingId)
    {
        try {
            // Controleer of meeting bestaat
            $meeting = Meeting::find($meetingId);
            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'error' => 'Meeting niet gevonden'
                ], 404);
            }

            // Haal het meest recente report op
            $report = MeetingReport::where('meeting_id', $meetingId)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'error' => 'Geen verslag gevonden voor dit gesprek'
                ], 404);
            }

            // Parse de report content (als het JSON is)
            $reportContent = $report->report_content;
            if (is_string($reportContent)) {
                $reportContent = json_decode($reportContent, true);
            }

            // Parse metadata
            $metadata = $report->metadata;
            if (is_string($metadata)) {
                $metadata = json_decode($metadata, true);
            }

            // Bereid de response voor
            $responseData = [
                'id' => $report->id,
                'meeting_id' => $report->meeting_id,
                'report_title' => $report->report_title,
                'report_type' => $report->report_type,
                'generated_by' => $report->generated_by,
                'generated_at' => $report->generated_at,
                'created_at' => $report->created_at,
                'updated_at' => $report->updated_at,
                'metadata' => $metadata,
                'meeting_title' => $meeting->title,
                'meeting_date' => $meeting->scheduled_at,
            ];

            // Voeg content toe gebaseerd op het type
            if (is_array($reportContent)) {
                // Structured content
                $responseData['summary'] = $reportContent['summary'] ?? '';
                $responseData['key_points'] = $reportContent['key_points'] ?? [];
                $responseData['action_items'] = $reportContent['action_items'] ?? [];
                $responseData['next_steps'] = $reportContent['next_steps'] ?? [];
                $responseData['participants'] = $reportContent['participants'] ?? [];
                $responseData['agenda_items'] = $reportContent['agenda_items'] ?? [];
                $responseData['statistics'] = $reportContent['statistics'] ?? [];
            } else {
                // Plain text content
                $responseData['content'] = $reportContent;
                $responseData['summary'] = $reportContent;
                $responseData['key_points'] = [];
                $responseData['action_items'] = [];
                $responseData['next_steps'] = [];
            }

            return response()->json([
                'success' => true,
                'data' => $responseData
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching meeting report', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Fout bij ophalen verslag: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update meeting report
     */
    public function updateMeetingReport(Request $request, $meetingId)
    {
        try {
            // Validatie
            $validated = $request->validate([
                'summary' => 'string|nullable',
                'key_points' => 'array|nullable',
                'action_items' => 'array|nullable',
                'next_steps' => 'array|nullable'
            ]);

            // Haal het report op
            $report = MeetingReport::where('meeting_id', $meetingId)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'error' => 'Geen verslag gevonden om bij te werken'
                ], 404);
            }

            // Update de content
            $currentContent = $report->report_content;
            if (is_string($currentContent)) {
                $currentContent = json_decode($currentContent, true) ?? [];
            }

            // Merge de nieuwe data
            $updatedContent = array_merge($currentContent, $validated);

            // Update het report
            $report->update([
                'report_content' => json_encode($updatedContent),
                'updated_at' => now()
            ]);

            // Return updated data
            return $this->getMeetingReport($meetingId);

        } catch (\Exception $e) {
            Log::error('Error updating meeting report', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Fout bij bijwerken verslag: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all reports for a meeting (history)
     */
    public function getMeetingReports($meetingId)
    {
        try {
            $meeting = Meeting::find($meetingId);
            if (!$meeting) {
                return response()->json([
                    'success' => false,
                    'error' => 'Meeting niet gevonden'
                ], 404);
            }

            $reports = MeetingReport::where('meeting_id', $meetingId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($report) {
                    return [
                        'id' => $report->id,
                        'report_title' => $report->report_title,
                        'report_type' => $report->report_type,
                        'generated_by' => $report->generated_by,
                        'generated_at' => $report->generated_at,
                        'created_at' => $report->created_at,
                        'updated_at' => $report->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $reports
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching meeting reports', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Fout bij ophalen verslagen: ' . $e->getMessage()
            ], 500);
        }
    }
}