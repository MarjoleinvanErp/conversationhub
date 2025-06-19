<?php
// File: backend/app/Services/N8NService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class N8NService
{
    protected $webhookUrl;
    protected $apiKey;
    protected $baseUrl;
    protected $timeout;

    public function __construct()
    {
        $this->webhookUrl = env('N8N_WEBHOOK_URL');
        $this->apiKey = env('N8N_API_KEY');
        $this->baseUrl = env('N8N_BASE_URL', 'http://n8n:5678');
        $this->timeout = 30;
    }

    /**
     * Export meeting data to N8N workflow
     */
    public function exportToN8N(array $data): array
    {
        try {
            if (!$this->webhookUrl) {
                throw new \Exception('N8N webhook URL niet geconfigureerd');
            }

            $exportId = Str::uuid()->toString();
            
            $payload = [
                'export_id' => $exportId,
                'type' => 'meeting_export',
                'timestamp' => now()->toISOString(),
                'data' => $data
            ];

            Log::info('N8N Export payload', ['export_id' => $exportId, 'meeting_id' => $data['meeting']['id']]);

            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($this->webhookUrl, $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                
                Log::info('N8N Export successful', [
                    'export_id' => $exportId,
                    'response' => $responseData
                ]);

                return [
                    'success' => true,
                    'export_id' => $exportId,
                    'webhook_triggered' => true,
                    'data' => $responseData,
                    'message' => 'Data succesvol naar N8N verzonden'
                ];
            } else {
                throw new \Exception('N8N webhook response error: ' . $response->status() . ' - ' . $response->body());
            }

        } catch (\Exception $e) {
            Log::error('N8N Export error: ' . $e->getMessage(), [
                'webhook_url' => $this->webhookUrl,
                'data_keys' => array_keys($data)
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'export_id' => $exportId ?? null
            ];
        }
    }

    /**
     * Generate report via N8N
     */
    public function generateReport(array $reportData): array
    {
        try {
            if (!$this->webhookUrl) {
                throw new \Exception('N8N webhook URL niet geconfigureerd');
            }

            $reportId = Str::uuid()->toString();
            
            $payload = [
                'report_id' => $reportId,
                'type' => 'report_generation',
                'timestamp' => now()->toISOString(),
                'data' => $reportData
            ];

            Log::info('N8N Report generation request', [
                'report_id' => $reportId, 
                'meeting_id' => $reportData['meeting_id']
            ]);

            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post($this->webhookUrl . '/report', $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                
                return [
                    'success' => true,
                    'report_id' => $reportId,
                    'estimated_completion' => now()->addMinutes(5)->toISOString(),
                    'data' => $responseData,
                    'message' => 'Verslag generatie gestart'
                ];
            } else {
                throw new \Exception('N8N report webhook error: ' . $response->status());
            }

        } catch (\Exception $e) {
            Log::error('N8N Report generation error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'report_id' => $reportId ?? null
            ];
        }
    }

    /**
     * Check export status
     */
    public function checkExportStatus(string $exportId): array
    {
        try {
            if (!$this->baseUrl) {
                // Fallback: assume completed if no API endpoint
                return [
                    'success' => true,
                    'status' => 'completed',
                    'message' => 'Export status check niet beschikbaar'
                ];
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/export/{$exportId}/status");

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'status' => $data['status'] ?? 'unknown',
                    'data' => $data
                ];
            }

            return [
                'success' => false,
                'error' => 'Status check mislukt: ' . $response->status()
            ];

        } catch (\Exception $e) {
            Log::error('N8N Export status check error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get report status
     */
    public function getReportStatus(string $reportId): array
    {
        try {
            if (!$this->baseUrl) {
                // Fallback: assume generating
                return [
                    'success' => true,
                    'status' => 'generating',
                    'message' => 'Report status check niet beschikbaar'
                ];
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/report/{$reportId}/status");

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'status' => $data['status'] ?? 'unknown',
                    'data' => $data
                ];
            }

            return [
                'success' => false,
                'error' => 'Report status check mislukt'
            ];

        } catch (\Exception $e) {
            Log::error('N8N Report status check error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Download completed report
     */
    public function downloadReport(string $reportId): array
    {
        try {
            if (!$this->baseUrl) {
                return [
                    'success' => false,
                    'error' => 'N8N base URL niet geconfigureerd'
                ];
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/report/{$reportId}/download");

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'content' => $data['content'] ?? $data,
                    'format' => $data['format'] ?? 'markdown',
                    'data' => $data
                ];
            }

            return [
                'success' => false,
                'error' => 'Report download mislukt'
            ];

        } catch (\Exception $e) {
            Log::error('N8N Report download error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send live update to N8N
     */
    public function sendLiveUpdate(string $meetingId, array $liveData): array
    {
        try {
            if (!$this->webhookUrl) {
                // Silent fail for live updates if no webhook configured
                return [
                    'success' => true,
                    'message' => 'Live updates niet geconfigureerd'
                ];
            }

            $payload = [
                'type' => 'live_update',
                'meeting_id' => $meetingId,
                'timestamp' => now()->toISOString(),
                'data' => $liveData
            ];

            $response = Http::timeout(10) // Shorter timeout for live updates
                ->withHeaders($this->getHeaders())
                ->post($this->webhookUrl . '/live', $payload);

            return [
                'success' => $response->successful(),
                'message' => $response->successful() ? 'Live update verzonden' : 'Live update mislukt',
                'data' => $response->json()
            ];

        } catch (\Exception $e) {
            Log::warning('N8N Live update error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Test N8N connection
     */
    public function testConnection(): array
    {
        try {
            if (!$this->webhookUrl && !$this->baseUrl) {
                return [
                    'success' => false,
                    'error' => 'Geen N8N URLs geconfigureerd'
                ];
            }

            $testPayload = [
                'type' => 'connection_test',
                'timestamp' => now()->toISOString(),
                'test_id' => Str::uuid()->toString()
            ];

            // Test webhook if available
            if ($this->webhookUrl) {
                $response = Http::timeout(10)
                    ->withHeaders($this->getHeaders())
                    ->post($this->webhookUrl . '/test', $testPayload);

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'message' => 'N8N webhook verbinding succesvol',
                        'data' => [
                            'webhook_status' => 'connected',
                            'response_time' => $response->handlerStats()['total_time'] ?? null
                        ]
                    ];
                }
            }

            // Test API if available
            if ($this->baseUrl) {
                $response = Http::timeout(10)
                    ->withHeaders($this->getHeaders())
                    ->get("{$this->baseUrl}/healthz");

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'message' => 'N8N API verbinding succesvol',
                        'data' => [
                            'api_status' => 'connected',
                            'response_time' => $response->handlerStats()['total_time'] ?? null
                        ]
                    ];
                }
            }

            return [
                'success' => false,
                'error' => 'Geen succesvolle N8N verbinding'
            ];

        } catch (\Exception $e) {
            Log::error('N8N Connection test error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get request headers for N8N API calls
     */
    private function getHeaders(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'User-Agent' => 'ConversationHub/1.0'
        ];

        if ($this->apiKey) {
            $headers['Authorization'] = 'Bearer ' . $this->apiKey;
        }

        return $headers;
    }

    /**
     * Check if N8N is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->webhookUrl) || !empty($this->baseUrl);
    }

    /**
     * Get configuration status
     */
    public function getConfigStatus(): array
    {
        return [
            'webhook_configured' => !empty($this->webhookUrl),
            'api_configured' => !empty($this->baseUrl),
            'auth_configured' => !empty($this->apiKey),
            'fully_configured' => $this->isConfigured() && !empty($this->apiKey)
        ];
    }
}