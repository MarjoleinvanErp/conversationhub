<?php
// File: backend/app/Http/Controllers/Api/N8NController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\N8NService;
use App\Models\Meeting;
use App\Models\Transcription;
use App\Models\N8NExport;
use App\Models\N8NReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class N8NController extends Controller
{
    protected $n8nService;

    public function __construct(N8NService $n8nService)
    {
        $this->n8nService = $n8nService;
    }

    /**
     * Export meeting data to N8N workflow
     */
    public function exportMeeting(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'meeting_id' => 'required|exists:meetings,id',
                'export_options' => 'sometimes|array',
                'export_options.include_transcriptions' => 'sometimes|boolean',
                'export_options.include_agenda' => 'sometimes|boolean',
                'export_options.include_participants' => 'sometimes|boolean',
                'export_options.include_metadata' => 'sometimes|boolean',
                'export_options.format' => 'sometimes|string|in:complete,summary,minimal'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validatie fout',
                    'errors' => $validator->errors()
                ], 422);
            }

            $meetingId = $request->input('meeting_id');
            $exportOptions = $request->input('export_options', []);
            
            Log::info('N8N Export requested', [
                'meeting_id' => $meetingId,
                'user_id' => auth()->id(),
                'options' => $exportOptions
            ]);

            // Load meeting with all related data
            $meeting = Meeting::with([
                'participants',
                'agenda_items',
                'transcriptions' => function ($query) use ($exportOptions) {
                    if (!($exportOptions['include_transcriptions'] ?? true)) {
                        $query->whereRaw('1=0'); // Exclude transcriptions
                    }
                }
            ])->findOrFail($meetingId);

            // Check authorization
            if (!$this->canAccessMeeting($meeting)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze meeting'
                ], 403);
            }

            // Prepare export data
            $exportData = $this->prepareExportData($meeting, $exportOptions);
            
            // Send to N8N
            $result = $this->n8nService->exportToN8N($exportData);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'N8N export mislukt',
                    'error' => $result['error']
                ], 500);
            }

            // Store export record
            $export = N8NExport::create([
                'meeting_id' => $meetingId,
                'user_id' => auth()->id(),
                'export_id' => $result['export_id'],
                'status' => 'sent',
                'export_options' => $exportOptions,
                'n8n_response' => $result['data']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Meeting succesvol geëxporteerd naar N8N',
                'data' => [
                    'export_id' => $export->export_id,
                    'webhook_triggered' => $result['webhook_triggered'],
                    'status' => $export->status,
                    'created_at' => $export->created_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N export error: ' . $e->getMessage(), [
                'meeting_id' => $request->input('meeting_id'),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij exporteren naar N8N',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get export status
     */
    public function getExportStatus(string $exportId): JsonResponse
    {
        try {
            $export = N8NExport::where('export_id', $exportId)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            // Check status with N8N if still pending
            if (in_array($export->status, ['sent', 'processing'])) {
                $statusResult = $this->n8nService->checkExportStatus($exportId);
                
                if ($statusResult['success']) {
                    $export->update([
                        'status' => $statusResult['status'],
                        'updated_at' => now()
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'export_id' => $export->export_id,
                    'status' => $export->status,
                    'created_at' => $export->created_at,
                    'updated_at' => $export->updated_at,
                    'meeting_id' => $export->meeting_id
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Export status error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen export status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Request report generation
     */
    public function generateReport(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'meeting_id' => 'required|exists:meetings,id',
                'report_options' => 'sometimes|array',
                'report_options.type' => 'sometimes|string|in:standard,summary,detailed',
                'report_options.language' => 'sometimes|string|in:nl,en',
                'report_options.format' => 'sometimes|string|in:markdown,html,pdf,docx'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validatie fout',
                    'errors' => $validator->errors()
                ], 422);
            }

            $meetingId = $request->input('meeting_id');
            $reportOptions = $request->input('report_options', []);

            $meeting = Meeting::with(['transcriptions', 'participants', 'agenda_items'])
                ->findOrFail($meetingId);

            if (!$this->canAccessMeeting($meeting)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze meeting'
                ], 403);
            }

            // Prepare data for report generation
            $reportData = $this->prepareReportData($meeting, $reportOptions);
            
            // Request report from N8N
            $result = $this->n8nService->generateReport($reportData);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verslag generatie mislukt',
                    'error' => $result['error']
                ], 500);
            }

            // Store report request
            $report = N8NReport::create([
                'meeting_id' => $meetingId,
                'user_id' => auth()->id(),
                'report_id' => $result['report_id'],
                'status' => 'requested',
                'report_options' => $reportOptions,
                'estimated_completion' => $result['estimated_completion'] ?? now()->addMinutes(5)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verslag generatie gestart',
                'data' => [
                    'report_id' => $report->report_id,
                    'status' => $report->status,
                    'estimated_completion' => $report->estimated_completion,
                    'created_at' => $report->created_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Report generation error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij aanvragen verslag generatie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get generated report
     */
    public function getReport(string $reportId): JsonResponse
    {
        try {
            $report = N8NReport::where('report_id', $reportId)
                ->where('user_id', auth()->id())
                ->with('meeting')
                ->firstOrFail();

            // Check if report is ready
            if ($report->status === 'requested' || $report->status === 'generating') {
                $statusResult = $this->n8nService->getReportStatus($reportId);
                
                if ($statusResult['success'] && $statusResult['status'] === 'completed') {
                    $reportContent = $this->n8nService->downloadReport($reportId);
                    
                    if ($reportContent['success']) {
                        $report->update([
                            'status' => 'completed',
                            'content' => $reportContent['content'],
                            'completed_at' => now()
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'report_id' => $report->report_id,
                    'meeting_id' => $report->meeting_id,
                    'status' => $report->status,
                    'content' => $report->content,
                    'report_options' => $report->report_options,
                    'created_at' => $report->created_at,
                    'completed_at' => $report->completed_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get report error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen verslag',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all reports for a meeting
     */
    public function getMeetingReports(string $meetingId): JsonResponse
    {
        try {
            $meeting = Meeting::findOrFail($meetingId);
            
            if (!$this->canAccessMeeting($meeting)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze meeting'
                ], 403);
            }

            $reports = N8NReport::where('meeting_id', $meetingId)
                ->where('user_id', auth()->id())
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reports->map(function ($report) {
                    return [
                        'report_id' => $report->report_id,
                        'status' => $report->status,
                        'report_options' => $report->report_options,
                        'has_content' => !empty($report->content),
                        'created_at' => $report->created_at,
                        'completed_at' => $report->completed_at
                    ];
                })
            ]);

        } catch (\Exception $e) {
            Log::error('Get meeting reports error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen meeting verslagen',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send live update to N8N
     */
    public function sendLiveUpdate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'meeting_id' => 'required|exists:meetings,id',
                'live_data' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validatie fout',
                    'errors' => $validator->errors()
                ], 422);
            }

            $meetingId = $request->input('meeting_id');
            $liveData = $request->input('live_data');

            $meeting = Meeting::findOrFail($meetingId);
            
            if (!$this->canAccessMeeting($meeting)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot deze meeting'
                ], 403);
            }

            // Send live update to N8N
            $result = $this->n8nService->sendLiveUpdate($meetingId, $liveData);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'data' => $result['data'] ?? null
            ]);

        } catch (\Exception $e) {
            Log::error('Live update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Fout bij versturen live update',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test N8N connection
     */
    public function testConnection(): JsonResponse
    {
        try {
            $result = $this->n8nService->testConnection();

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'data' => $result['data'] ?? null
            ]);

        } catch (\Exception $e) {
            Log::error('N8N connection test error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'N8N verbinding test mislukt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prepare export data for N8N
     */
    private function prepareExportData(Meeting $meeting, array $options): array
    {
        $data = [
            'meeting' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'description' => $meeting->description,
                'status' => $meeting->status,
                'scheduled_start' => $meeting->scheduled_start,
                'scheduled_end' => $meeting->scheduled_end,
                'actual_start' => $meeting->actual_start,
                'actual_end' => $meeting->actual_end,
                'created_at' => $meeting->created_at,
                'updated_at' => $meeting->updated_at
            ]
        ];

        if ($options['include_participants'] ?? true) {
            $data['participants'] = $meeting->participants->map(function ($participant) {
                return [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'role' => $participant->role,
                    'email' => $participant->email
                ];
            });
        }

        if ($options['include_agenda'] ?? true) {
            $data['agenda_items'] = $meeting->agenda_items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'order_index' => $item->order_index,
                    'status' => $item->status,
                    'estimated_duration' => $item->estimated_duration
                ];
            });
        }

        if ($options['include_transcriptions'] ?? true) {
            $data['transcriptions'] = $meeting->transcriptions->map(function ($transcription) {
                return [
                    'id' => $transcription->id,
                    'text' => $transcription->text,
                    'speaker' => $transcription->speaker,
                    'speaker_name' => $transcription->speaker_name,
                    'source' => $transcription->source,
                    'confidence' => $transcription->confidence,
                    'start_time' => $transcription->start_time,
                    'end_time' => $transcription->end_time,
                    'created_at' => $transcription->created_at
                ];
            });
        }

        if ($options['include_metadata'] ?? true) {
            $data['metadata'] = [
                'total_transcriptions' => $meeting->transcriptions->count(),
                'total_participants' => $meeting->participants->count(),
                'total_agenda_items' => $meeting->agenda_items->count(),
                'export_timestamp' => now()->toISOString(),
                'export_user_id' => auth()->id()
            ];
        }

        return $data;
    }

    /**
     * Prepare data for report generation
     */
    private function prepareReportData(Meeting $meeting, array $options): array
    {
        return [
            'meeting_id' => $meeting->id,
            'meeting_title' => $meeting->title,
            'meeting_date' => $meeting->scheduled_start,
            'transcriptions' => $meeting->transcriptions->pluck('text')->toArray(),
            'participants' => $meeting->participants->pluck('name')->toArray(),
            'agenda_items' => $meeting->agenda_items->pluck('title')->toArray(),
            'report_options' => $options
        ];
    }

    /**
     * Check if user can access meeting
     */
    private function canAccessMeeting(Meeting $meeting): bool
    {
        // For now, check if user is owner or participant
        return $meeting->created_by === auth()->id() || 
               $meeting->participants()->where('user_id', auth()->id())->exists();
    }
}