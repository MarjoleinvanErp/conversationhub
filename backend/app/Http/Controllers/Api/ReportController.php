<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingReport;
use App\Models\ReportSection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * Get all reports for a meeting (READ ONLY - N8N creates reports)
     */
    public function index(Meeting $meeting): JsonResponse
    {
        $reports = $meeting->reports()
            ->with(['sections' => function ($query) {
                $query->orderBy('order_index');
            }])
            ->orderBy('version_number', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'reports' => $reports->map(function ($report) {
                return [
                    'id' => $report->id,
                    'meeting_id' => $report->meeting_id,
                    'report_title' => $report->report_title,
                    'report_type' => $report->report_type,
                    'generated_by' => $report->generated_by,
                    'generated_at' => $report->generated_at,
                    'version_number' => $report->version_number,
                    'status' => $report->status,
                    'privacy_filtered' => $report->privacy_filtered,
                    'sections_count' => $report->sections->count(),
                    'has_privacy_content' => $report->hasPrivacyContent()
                ];
            })
        ]);
    }

    /**
     * Show specific report with sections
     */
    public function show(Meeting $meeting, MeetingReport $report): JsonResponse
    {
        $report->load(['sections' => function ($query) {
            $query->orderBy('order_index');
        }]);

        return response()->json([
            'success' => true,
            'report' => [
                'id' => $report->id,
                'meeting_id' => $report->meeting_id,
                'report_title' => $report->report_title,
                'report_type' => $report->report_type,
                'generated_by' => $report->generated_by,
                'generated_at' => $report->generated_at,
                'version_number' => $report->version_number,
                'status' => $report->status,
                'privacy_filtered' => $report->privacy_filtered,
                'is_editable' => $report->is_editable,
                'sections' => $report->sections,
                'html_content' => $report->toHtml()
            ]
        ]);
    }

    /**
     * Update a specific section (USER EDITING)
     */
    public function updateSection(Meeting $meeting, MeetingReport $report, ReportSection $section, Request $request): JsonResponse
    {
        $request->validate([
            'content' => 'required|string',
            'title' => 'sometimes|string|max:255'
        ]);

        if (!$section->is_editable) {
            return response()->json([
                'success' => false,
                'message' => 'Deze sectie kan niet worden bewerkt'
            ], 403);
        }

        $section->updateContent($request->get('content'), Auth::id());
        
        if ($request->has('title')) {
            $section->update(['title' => $request->get('title')]);
        }

        return response()->json([
            'success' => true,
            'section' => $section->fresh(),
            'message' => 'Sectie succesvol bijgewerkt'
        ]);
    }

    /**
     * Toggle privacy filtering for entire report
     */
    public function togglePrivacyFiltering(Meeting $meeting, MeetingReport $report): JsonResponse
    {
        if ($report->privacy_filtered) {
            // Restore original content
            foreach ($report->sections as $section) {
                if ($section->original_content) {
                    $section->update([
                        'content' => $section->original_content,
                        'contains_privacy_info' => false,
                        'privacy_markers' => null
                    ]);
                }
            }
            $report->update(['privacy_filtered' => false]);
            $message = 'Privacy-filtering uitgeschakeld';
        } else {
            // Apply filtering
            foreach ($report->sections as $section) {
                $section->applyPrivacyFiltering();
            }
            $report->update(['privacy_filtered' => true]);
            $message = 'Privacy-filtering toegepast';
        }

        $report->load(['sections' => function ($query) {
            $query->orderBy('order_index');
        }]);

        return response()->json([
            'success' => true,
            'report' => $report,
            'message' => $message
        ]);
    }

    /**
     * Export report as HTML
     */
    public function exportHtml(Meeting $meeting, MeetingReport $report): JsonResponse
    {
        return response()->json([
            'success' => true,
            'html_content' => $report->toHtml(),
            'report_title' => $report->report_title
        ]);
    }

    /**
     * Get report statistics (for dashboard/overview)
     */
    public function getReportStats(Meeting $meeting): JsonResponse
    {
        $reports = $meeting->reports;
        $totalSections = $meeting->reports()->withCount('sections')->get()->sum('sections_count');
        $privacyFiltered = $meeting->reports()->where('privacy_filtered', true)->count();

        return response()->json([
            'success' => true,
            'stats' => [
                'total_reports' => $reports->count(),
                'total_sections' => $totalSections,
                'privacy_filtered_reports' => $privacyFiltered,
                'latest_report_date' => $reports->max('generated_at'),
                'report_types' => $reports->groupBy('report_type')->map->count()
            ]
        ]);
    }
}