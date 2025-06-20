<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class N8NService
{
    private string $baseUrl;
    private string $username;
    private string $password;
    private string $webhookBaseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('N8N_URL', 'http://n8n:5678'), '/');
        $this->username = env('N8N_API_USER', 'admin');
        $this->password = env('N8N_API_PASSWORD', 'conversationhub123');
        $this->webhookBaseUrl = rtrim(env('N8N_WEBHOOK_BASE_URL', 'http://n8n:5678/webhook'), '/');
    }

    /**
     * Get authentication token from N8N
     */
    private function getAuthToken(): ?string
    {
        $cacheKey = 'n8n_auth_token';
        
        // Check cache first (token geldig voor 1 uur)
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            Log::info('N8N: Requesting authentication token', [
                'url' => $this->baseUrl . '/rest/login',
                'username' => $this->username
            ]);

            $response = Http::timeout(10)->post($this->baseUrl . '/rest/login', [
                'email' => $this->username,
                'password' => $this->password
            ]);

            if (!$response->successful()) {
                Log::error('N8N: Authentication failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }

            $data = $response->json();
            $token = $data['data']['token'] ?? null;

            if ($token) {
                // Cache token for 50 minutes (expires in 1 hour)
                Cache::put($cacheKey, $token, now()->addMinutes(50));
                Log::info('N8N: Authentication successful, token cached');
            }

            return $token;

        } catch (\Exception $e) {
            Log::error('N8N: Authentication error', [
                'error' => $e->getMessage(),
                'url' => $this->baseUrl
            ]);
            return null;
        }
    }

    /**
     * Check if N8N is available and accessible
     */
    public function checkConnection(): array
    {
        try {
            // Test basic connectivity
            $response = Http::timeout(5)->get($this->baseUrl . '/healthz');
            
            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => 'N8N not reachable',
                    'status' => $response->status()
                ];
            }

            // Test authentication
            $token = $this->getAuthToken();
            if (!$token) {
                return [
                    'success' => false,
                    'message' => 'N8N authentication failed',
                    'status' => 401
                ];
            }

            return [
                'success' => true,
                'message' => 'N8N connection successful',
                'url' => $this->baseUrl,
                'webhook_url' => $this->webhookBaseUrl
            ];

        } catch (\Exception $e) {
            Log::error('N8N: Connection check failed', [
                'error' => $e->getMessage(),
                'url' => $this->baseUrl
            ]);

            return [
                'success' => false,
                'message' => 'N8N connection error: ' . $e->getMessage(),
                'status' => 500
            ];
        }
    }

    /**
     * Get list of available workflows
     */
    public function getWorkflows(): array
    {
        $token = $this->getAuthToken();
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Authentication failed',
                'data' => []
            ];
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Content-Type' => 'application/json'
                ])
                ->get($this->baseUrl . '/rest/workflows');

            if (!$response->successful()) {
                Log::error('N8N: Failed to get workflows', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return [
                    'success' => false,
                    'message' => 'Failed to retrieve workflows',
                    'data' => []
                ];
            }

            $workflows = $response->json('data', []);

            return [
                'success' => true,
                'message' => 'Workflows retrieved successfully',
                'data' => $workflows
            ];

        } catch (\Exception $e) {
            Log::error('N8N: Get workflows error', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Error retrieving workflows: ' . $e->getMessage(),
                'data' => []
            ];
        }
    }

    /**
     * Send meeting summary to N8N webhook
     */
    public function sendMeetingSummary(array $meetingData): array
    {
        try {
            // Prepare data for N8N webhook
            $webhookData = [
                'meeting_id' => $meetingData['id'] ?? null,
                'title' => $meetingData['title'] ?? 'Onbekende vergadering',
                'date' => $meetingData['date'] ?? now()->toISOString(),
                'participants' => $meetingData['participants'] ?? [],
                'summary' => $meetingData['summary'] ?? '',
                'action_items' => $meetingData['action_items'] ?? [],
                'transcript' => $meetingData['transcript'] ?? '',
                'duration_minutes' => $meetingData['duration_minutes'] ?? 0,
                'timestamp' => now()->toISOString(),
                'source' => 'ConversationHub'
            ];

            Log::info('N8N: Sending meeting summary', [
                'meeting_id' => $webhookData['meeting_id'],
                'webhook_url' => $this->webhookBaseUrl . '/conversationhub-meeting'
            ]);

            // Send to N8N webhook
            $response = Http::timeout(30)
                ->post($this->webhookBaseUrl . '/conversationhub-meeting', $webhookData);

            if (!$response->successful()) {
                Log::error('N8N: Webhook call failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'meeting_id' => $webhookData['meeting_id']
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to send meeting summary to N8N',
                    'status' => $response->status()
                ];
            }

            $responseData = $response->json();

            Log::info('N8N: Meeting summary sent successfully', [
                'meeting_id' => $webhookData['meeting_id'],
                'response' => $responseData
            ]);

            return [
                'success' => true,
                'message' => 'Meeting summary sent to N8N successfully',
                'data' => $responseData
            ];

        } catch (\Exception $e) {
            Log::error('N8N: Send meeting summary error', [
                'error' => $e->getMessage(),
                'meeting_id' => $meetingData['id'] ?? 'unknown'
            ]);

            return [
                'success' => false,
                'message' => 'Error sending meeting summary: ' . $e->getMessage(),
                'status' => 500
            ];
        }
    }

    /**
     * Test webhook connectivity
     */
    public function testWebhook(): array
    {
        try {
            $testData = [
                'test' => true,
                'message' => 'ConversationHub webhook test',
                'timestamp' => now()->toISOString()
            ];

            $response = Http::timeout(10)
                ->post($this->webhookBaseUrl . '/conversationhub-test', $testData);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => 'Webhook test failed',
                    'status' => $response->status(),
                    'url' => $this->webhookBaseUrl . '/conversationhub-test'
                ];
            }

            return [
                'success' => true,
                'message' => 'Webhook test successful',
                'data' => $response->json(),
                'url' => $this->webhookBaseUrl . '/conversationhub-test'
            ];

        } catch (\Exception $e) {
            Log::error('N8N: Webhook test error', [
                'error' => $e->getMessage(),
                'url' => $this->webhookBaseUrl
            ]);

            return [
                'success' => false,
                'message' => 'Webhook test error: ' . $e->getMessage(),
                'status' => 500
            ];
        }
    }

    /**
     * Get N8N configuration for frontend
     */
    public function getConfig(): array
    {
        return [
            'enabled' => !empty($this->baseUrl),
            'url' => $this->baseUrl,
            'webhook_base_url' => $this->webhookBaseUrl,
            'auto_export_enabled' => env('N8N_AUTO_EXPORT_ENABLED', false),
            'auto_export_interval' => env('N8N_AUTO_EXPORT_INTERVAL', 10),
            'connected' => $this->checkConnection()['success']
        ];
    }
}