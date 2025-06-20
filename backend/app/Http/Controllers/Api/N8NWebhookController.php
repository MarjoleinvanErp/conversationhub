<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class N8NWebhookController extends Controller
{
    /**
     * Health check endpoint for N8N
     * Simple endpoint to verify ConversationHub is reachable from N8N
     */
    public function health(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'ConversationHub N8N webhook endpoint is healthy',
                'timestamp' => now()->toISOString(),
                'version' => '1.0.0'
            ]);

        } catch (\Exception $e) {
            Log::error('N8N webhook health check error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Health check failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle completed report from N8N
     * Called by N8N when a report generation is completed
     */
    public function reportCompleted(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'report_id' => 'required|string',
                'meeting_id' => 'required|integer',
                'status' => 'required|string|in:completed,failed',
                'report_data' => 'sometimes|array',
                'error_message' => 'sometimes|string',
                'generated_at' => 'sometimes|string'
            ]);

            if ($validator->fails()) {
                Log::warning('N8N report completed webhook validation failed', [
                    'errors' => $validator->errors(),
                    'payload' => $request->all()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid webhook payload',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Log the incoming webhook
            Log::info('N8N report completed webhook received', [
                'report_id' => $request->report_id,
                'meeting_id' => $request->meeting_id,
                'status' => $request->status
            ]);

            // TODO: Process the completed report
            // - Store report data in database
            // - Notify relevant users
            // - Update meeting status
            // - Send notifications if needed

            $responseData = [
                'received_at' => now()->toISOString(),
                'report_id' => $request->report_id,
                'meeting_id' => $request->meeting_id,
                'processed' => true
            ];

            if ($request->status === 'failed') {
                Log::error('N8N report generation failed', [
                    'report_id' => $request->report_id,
                    'meeting_id' => $request->meeting_id,
                    'error' => $request->error_message
                ]);

                $responseData['error_logged'] = true;
            }

            return response()->json([
                'success' => true,
                'message' => 'Report completion webhook processed',
                'data' => $responseData
            ]);

        } catch (\Exception $e) {
            Log::error('N8N report completed webhook error: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process report completion webhook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle completed export from N8N
     * Called by N8N when an export operation is completed
     */
    public function exportCompleted(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'export_id' => 'required|string',
                'meeting_id' => 'required|integer',
                'status' => 'required|string|in:completed,failed',
                'export_format' => 'sometimes|string|in:json,xml,csv,pdf',
                'file_url' => 'sometimes|string|url',
                'file_size' => 'sometimes|integer',
                'error_message' => 'sometimes|string',
                'exported_at' => 'sometimes|string'
            ]);

            if ($validator->fails()) {
                Log::warning('N8N export completed webhook validation failed', [
                    'errors' => $validator->errors(),
                    'payload' => $request->all()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid webhook payload',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Log the incoming webhook
            Log::info('N8N export completed webhook received', [
                'export_id' => $request->export_id,
                'meeting_id' => $request->meeting_id,
                'status' => $request->status,
                'format' => $request->export_format
            ]);

            // TODO: Process the completed export
            // - Update export status in database
            // - Store file information
            // - Notify users that export is ready
            // - Send download links if needed

            $responseData = [
                'received_at' => now()->toISOString(),
                'export_id' => $request->export_id,
                'meeting_id' => $request->meeting_id,
                'processed' => true
            ];

            if ($request->status === 'completed' && $request->file_url) {
                $responseData['download_ready'] = true;
                $responseData['file_info'] = [
                    'url' => $request->file_url,
                    'format' => $request->export_format,
                    'size' => $request->file_size
                ];
            }

            if ($request->status === 'failed') {
                Log::error('N8N export failed', [
                    'export_id' => $request->export_id,
                    'meeting_id' => $request->meeting_id,
                    'error' => $request->error_message
                ]);

                $responseData['error_logged'] = true;
            }

            return response()->json([
                'success' => true,
                'message' => 'Export completion webhook processed',
                'data' => $responseData
            ]);

        } catch (\Exception $e) {
            Log::error('N8N export completed webhook error: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process export completion webhook',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generic webhook endpoint for custom N8N workflows
     * Allows N8N to send any custom data back to ConversationHub
     */
    public function customWebhook(Request $request): JsonResponse
    {
        try {
            // Log all incoming custom webhook data
            Log::info('N8N custom webhook received', [
                'payload' => $request->all(),
                'headers' => $request->headers->all(),
                'ip' => $request->ip()
            ]);

            // Basic validation - at minimum we expect some data
            if (!$request->hasAny(['meeting_id', 'workflow_id', 'data'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Webhook payload appears to be empty or invalid'
                ], 422);
            }

            // TODO: Process custom webhook data based on workflow_id or other identifiers
            // This can be extended to handle different types of N8N workflows

            return response()->json([
                'success' => true,
                'message' => 'Custom webhook received and logged',
                'data' => [
                    'received_at' => now()->toISOString(),
                    'payload_size' => strlen(json_encode($request->all())),
                    'processed' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('N8N custom webhook error: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process custom webhook',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}