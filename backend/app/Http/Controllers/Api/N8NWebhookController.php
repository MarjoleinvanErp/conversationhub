<?php
// File: backend/app/Http/Controllers/Api/N8NWebhookController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\N8NReport;
use App\Models\N8NExport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class N8NWebhookController extends Controller
{
    /**
     * Handle completed report from N8N
     * Webhook endpoint: POST /api/webhook/n8n/report-completed
     */
    public function reportCompleted(Request $request): JsonResponse
    {
        try {
            Log::info('N8N Report webhook received', $request->all());

            // Validate webhook payload
            $reportId = $request->input('report_id');
            $status = $request->input('status', 'completed');
            $content = $request->input('content');
            $format = $request->input('format', 'markdown');
            $errorMessage = $request->input('error_message');

            if (!$reportId) {
                return response()->json([
                    'success' => false,
                    'message' => 'report_id is verplicht'
                ], 400);
            }

            // Find the report record
            $report = N8NReport::where('report_id', $reportId)->first();
            
            if (!$report) {
                Log::warning('N8N Report webhook: Report not found', ['report_id' => $reportId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Report niet gevonden'
                ], 404);
            }

            // Update report with N8N results
            $updateData = [
                'status' => $status,
                'format' => $format
            ];

            if ($status === 'completed' && $content) {
                $updateData['content'] = $content;
                $updateData['completed_at'] = now();
            } elseif ($status === 'failed' && $errorMessage) {
                $updateData['error_message'] = $errorMessage;
            }

            $report->update($updateData);

            Log::info('N8N Report updated', [
                'report_id' => $reportId,
                'status' => $status,
                'meeting_id' => $report->meeting_id,
                'user_id' => $report->user_id
            ]);

            // TODO: Optionally send real-time notification to frontend
            // via WebSockets/Pusher to notify user that report is ready

            return response()->json([
                'success' => true,
                'message' => 'Report status bijgewerkt',
                'data' => [
                    'report_id' => $reportId,
                    'status' => $status,
                    'updated_at' => $report->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N Report webhook error: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing fout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle completed export from N8N
     * Webhook endpoint: POST /api/webhook/n8n/export-completed
     */
    public function exportCompleted(Request $request): JsonResponse
    {
        try {
            Log::info('N8N Export webhook received', $request->all());

            // Validate webhook payload
            $exportId = $request->input('export_id');
            $status = $request->input('status', 'completed');
            $resultData = $request->input('result_data');
            $errorMessage = $request->input('error_message');

            if (!$exportId) {
                return response()->json([
                    'success' => false,
                    'message' => 'export_id is verplicht'
                ], 400);
            }

            // Find the export record
            $export = N8NExport::where('export_id', $exportId)->first();
            
            if (!$export) {
                Log::warning('N8N Export webhook: Export not found', ['export_id' => $exportId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Export niet gevonden'
                ], 404);
            }

            // Update export with N8N results
            $updateData = [
                'status' => $status
            ];

            if ($status === 'completed') {
                $updateData['completed_at'] = now();
                if ($resultData) {
                    $updateData['n8n_response'] = array_merge(
                        $export->n8n_response ?? [],
                        ['result' => $resultData]
                    );
                }
            } elseif ($status === 'failed' && $errorMessage) {
                $updateData['error_message'] = $errorMessage;
            }

            $export->update($updateData);

            Log::info('N8N Export updated', [
                'export_id' => $exportId,
                'status' => $status,
                'meeting_id' => $export->meeting_id,
                'user_id' => $export->user_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Export status bijgewerkt',
                'data' => [
                    'export_id' => $exportId,
                    'status' => $status,
                    'updated_at' => $export->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N Export webhook error: ' . $e->getMessage(), [
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing fout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle N8N live updates or notifications
     * Webhook endpoint: POST /api/webhook/n8n/notification
     */
    public function notification(Request $request): JsonResponse
    {
        try {
            Log::info('N8N Notification webhook received', $request->all());

            $type = $request->input('type');
            $data = $request->input('data', []);

            // Handle different notification types
            switch ($type) {
                case 'workflow_started':
                    Log::info('N8N Workflow started', $data);
                    break;
                    
                case 'workflow_completed':
                    Log::info('N8N Workflow completed', $data);
                    break;
                    
                case 'workflow_failed':
                    Log::warning('N8N Workflow failed', $data);
                    break;
                    
                case 'processing_update':
                    Log::info('N8N Processing update', $data);
                    // Could update progress in database or send to frontend
                    break;
                    
                default:
                    Log::info('N8N Unknown notification type', ['type' => $type, 'data' => $data]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notificatie ontvangen',
                'type' => $type
            ]);

        } catch (\Exception $e) {
            Log::error('N8N Notification webhook error: ' . $e->getMessage(), [
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Notificatie processing fout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * N8N health check endpoint
     * Webhook endpoint: GET /api/webhook/n8n/health
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'ConversationHub N8N webhook endpoint is healthy',
            'timestamp' => now()->toISOString(),
            'endpoints' => [
                'report_completed' => '/api/webhook/n8n/report-completed',
                'export_completed' => '/api/webhook/n8n/export-completed',
                'notification' => '/api/webhook/n8n/notification'
            ]
        ]);
    }
}