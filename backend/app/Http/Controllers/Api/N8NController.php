<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class N8NController extends Controller
{
    private string $webhookBaseUrl;

    public function __construct()
    {
        $this->webhookBaseUrl = rtrim(env('N8N_WEBHOOK_BASE_URL', 'http://n8n:5678/webhook'), '/');
    }

    /**
     * Get N8N status and configuration
     */
    public function status(): JsonResponse
    {
        try {
            // Test basic N8N connectivity
            $n8nUrl = env('N8N_URL', 'http://n8n:5678');
            
            $response = Http::timeout(5)->get($n8nUrl . '/');
            
            $connectionStatus = [
                'connected' => $response->successful(),
                'url' => $n8nUrl,
                'webhook_base_url' => $this->webhookBaseUrl,
                'status_code' => $response->status(),
                'tested_at' => now()->toISOString()
            ];

            if (!$response->successful()) {
                $connectionStatus['error'] = 'N8N not reachable';
                $connectionStatus['response_body'] = substr($response->body(), 0, 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'N8N status checked',
                'data' => [
                    'connection' => $connectionStatus,
                    'config' => [
                        'trigger_enabled' => true,
                        'data_endpoints_enabled' => true,
                        'webhook_endpoints_enabled' => true
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N status error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to get N8N status',
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
            $n8nUrl = env('N8N_URL', 'http://n8n:5678');
            
            Log::info('N8N: Testing connection', ['url' => $n8nUrl]);
            
            $response = Http::timeout(10)->get($n8nUrl . '/');
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'N8N connection successful',
                    'data' => [
                        'url' => $n8nUrl,
                        'status_code' => $response->status(),
                        'response_time' => 'under 10s'
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'N8N connection failed',
                    'data' => [
                        'url' => $n8nUrl,
                        'status_code' => $response->status(),
                        'error' => substr($response->body(), 0, 200)
                    ]
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('N8N connection test error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'N8N connection test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Trigger N8N workflow for meeting processing
     * Sends only meeting_id, N8N fetches data itself via /api/n8n-data endpoints
     */
    public function triggerMeeting(Request $request, $meetingId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'event_type' => 'sometimes|string|in:started,completed,updated,transcription_updated'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $eventType = $request->event_type ?? 'meeting_updated';

            // Prepare trigger data for N8N
            $triggerData = [
                'meeting_id' => (int) $meetingId,
                'event_type' => $eventType,
                'triggered_at' => now()->toISOString(),
                'source' => 'ConversationHub',
                'api_base_url' => env('APP_URL', 'http://backend:8000') . '/api/n8n-data',
                'webhook_id' => 'trigger_' . time()
            ];

            // Use configured webhook URL or fallback to default
            $legacyWebhookUrl = env('N8N_WEBHOOK_URL');
            if ($legacyWebhookUrl) {
                $webhookUrl = $legacyWebhookUrl;
            } else {
                $webhookUrl = $this->webhookBaseUrl . '/gespreksverslag';
            }

            Log::info('N8N: Triggering workflow', [
                'meeting_id' => $meetingId,
                'event_type' => $eventType,
                'webhook_url' => $webhookUrl
            ]);

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'ConversationHub-Trigger/1.0'
                ])
                ->post($webhookUrl, $triggerData);

            if (!$response->successful()) {
                Log::error('N8N: Trigger failed', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 500),
                    'meeting_id' => $meetingId,
                    'webhook_url' => $webhookUrl
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to trigger N8N workflow',
                    'data' => [
                        'meeting_id' => $meetingId,
                        'status_code' => $response->status(),
                        'webhook_url' => $webhookUrl
                    ]
                ], 500);
            }

            Log::info('N8N: Workflow triggered successfully', [
                'meeting_id' => $meetingId,
                'response' => $response->json()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'N8N workflow triggered successfully',
                'data' => [
                    'meeting_id' => $meetingId,
                    'event_type' => $eventType,
                    'trigger_data' => $triggerData,
                    'n8n_response' => $response->json(),
                    'webhook_url' => $webhookUrl
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N trigger meeting error: ' . $e->getMessage(), [
                'meeting_id' => $meetingId,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to trigger N8N workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Trigger when meeting is completed
     */
    public function triggerMeetingCompleted($meetingId): JsonResponse
    {
        $request = new Request(['event_type' => 'completed']);
        return $this->triggerMeeting($request, $meetingId);
    }

    /**
     * Trigger when meeting is started
     */
    public function triggerMeetingStarted($meetingId): JsonResponse
    {
        $request = new Request(['event_type' => 'started']);
        return $this->triggerMeeting($request, $meetingId);
    }

    /**
     * Test trigger functionality
     */
    public function testTrigger(): JsonResponse
    {
        try {
            $testData = [
                'meeting_id' => 999,
                'event_type' => 'test_trigger',
                'triggered_at' => now()->toISOString(),
                'source' => 'ConversationHub-Test',
                'api_base_url' => env('APP_URL', 'http://backend:8000') . '/api/n8n-data',
                'test_data' => [
                    'message' => 'This is a test trigger from ConversationHub',
                    'timestamp' => now()->toISOString(),
                    'environment' => env('APP_ENV', 'local')
                ]
            ];

            $webhookUrl = $this->webhookBaseUrl . '/gespreksverslag-test';

            Log::info('N8N: Sending test trigger', [
                'webhook_url' => $webhookUrl,
                'test_data' => $testData
            ]);

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'ConversationHub-Test/1.0'
                ])
                ->post($webhookUrl, $testData);

            if (!$response->successful()) {
                Log::warning('N8N: Test trigger failed', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 200),
                    'webhook_url' => $webhookUrl
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Test trigger failed',
                    'data' => [
                        'webhook_url' => $webhookUrl,
                        'status_code' => $response->status(),
                        'error_body' => substr($response->body(), 0, 200)
                    ]
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Test trigger sent successfully',
                'data' => [
                    'test_data' => $testData,
                    'webhook_url' => $webhookUrl,
                    'n8n_response' => $response->json()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N test trigger error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send test trigger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save AI-generated meeting report from N8N
     */
    public function saveReport(Request $request, $meetingId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'report_content' => 'required|string',
                'report_type' => 'sometimes|string|in:summary,detailed,ai_generated',
                'generated_by' => 'sometimes|string',
                'metadata' => 'sometimes|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $reportData = [
                'meeting_id' => (int) $meetingId,
                'title' => 'AI Gespreksverslag',
                'content' => $request->report_content,
                'type' => $request->report_type ?? 'ai_generated',
                'format' => 'markdown',
                'generated_by' => $request->generated_by ?? 'N8N_AI_Agent',
                'generated_at' => now(),
                'status' => 'completed',
                'metadata' => json_encode($request->metadata ?? [
                    'source' => 'N8N',
                    'ai_model' => 'GPT',
                    'version' => '1.0'
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ];

            // Try to insert into reports table
            try {
                $reportId = DB::table('reports')->insertGetId($reportData);
                
                Log::info('N8N: Report saved successfully', [
                    'meeting_id' => $meetingId,
                    'report_id' => $reportId,
                    'content_length' => strlen($request->report_content)
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Gespreksverslag succesvol opgeslagen',
                    'data' => [
                        'report_id' => $reportId,
                        'meeting_id' => $meetingId,
                        'saved_at' => now()->toISOString(),
                        'content_length' => strlen($request->report_content),
                        'type' => $reportData['type']
                    ]
                ]);

            } catch (\Exception $dbError) {
                // If reports table doesn't exist, save to meeting_reports table
                Log::warning('N8N: Reports table not found, trying meeting_reports', [
                    'error' => $dbError->getMessage()
                ]);

                $meetingReportData = [
                    'meeting_id' => (int) $meetingId,
                    'report_title' => 'AI Gespreksverslag',
                    'report_content' => $request->report_content,
                    'report_type' => $request->report_type ?? 'ai_generated',
                    'generated_by' => $request->generated_by ?? 'N8N_AI_Agent',
                    'created_at' => now(),
                    'updated_at' => now()
                ];

                $reportId = DB::table('meeting_reports')->insertGetId($meetingReportData);

                Log::info('N8N: Report saved to meeting_reports', [
                    'meeting_id' => $meetingId,
                    'report_id' => $reportId
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Gespreksverslag opgeslagen in meeting_reports',
                    'data' => [
                        'report_id' => $reportId,
                        'meeting_id' => $meetingId,
                        'table' => 'meeting_reports'
                    ]
                ]);
            }

        } catch (\Exception $e) {
            Log::error('N8N: Save report error', [
                'meeting_id' => $meetingId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij opslaan gespreksverslag',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}