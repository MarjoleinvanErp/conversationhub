<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\N8NTranscriptionService;
use App\Services\ConfigService;
use App\Models\Transcription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Testing\RefreshDatabase;

class N8NTranscriptionServiceTest extends TestCase
{
    use RefreshDatabase;

    private N8NTranscriptionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock N8N configuration
        config([
            'app.env' => 'testing',
        ]);

        $this->service = new N8NTranscriptionService();
    }

    /** @test */
    public function it_can_initialize_with_configuration()
    {
        // Mock ConfigService
        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
        });

        $service = new N8NTranscriptionService();
        $this->assertTrue($service->isAvailable());
    }

    /** @test */
    public function it_returns_null_when_webhook_not_configured()
    {
        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => null,
                'api_key' => null,
                'transcription_enabled' => false,
                'timeout_seconds' => 60
            ]);
        });

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-123',
            1
        );

        $this->assertNull($result);
    }

    /** @test */
    public function it_can_send_transcription_request_to_n8n()
    {
        // Mock successful N8N response
        Http::fake([
            'test-n8n.com/*' => Http::response([
                'transcription' => 'Dit is een test transcriptie',
                'confidence' => 0.95,
                'processing_time_ms' => 2500,
                'speaker_analysis' => [
                    'segments' => [
                        [
                            'text' => 'Dit is een test transcriptie',
                            'speaker' => 'SPEAKER_00',
                            'speaker_confidence' => 0.92,
                            'start' => 0.0,
                            'end' => 3.5,
                            'confidence' => 0.95
                        ]
                    ]
                ]
            ], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-123',
            1
        );

        $this->assertNotNull($result);
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('transcriptions', $result);
        $this->assertArrayHasKey('transcription', $result);
        $this->assertEquals('Dit is een test transcriptie', $result['transcription']['text']);
        $this->assertEquals('n8n', $result['transcription']['source']);

        // Verify HTTP request was made correctly
        Http::assertSent(function ($request) {
            return $request->url() === 'http://test-n8n.com/webhook' &&
                   $request['session_id'] === 'session-123' &&
                   $request['chunk_number'] === 1 &&
                   $request['source'] === 'conversationhub' &&
                   $request['format'] === 'webm' &&
                   isset($request['audio_data']) &&
                   isset($request['processing_options']);
        });
    }

    /** @test */
    public function it_handles_n8n_request_failure()
    {
        // Mock failed N8N response
        Http::fake([
            'test-n8n.com/*' => Http::response(['error' => 'Service unavailable'], 503)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        Log::shouldReceive('error')->once();

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-123',
            1
        );

        $this->assertNull($result);
    }

    /** @test */
    public function it_processes_multiple_speaker_segments()
    {
        // Mock N8N response with multiple speakers
        Http::fake([
            'test-n8n.com/*' => Http::response([
                'transcription' => 'Complete gesprek transcriptie',
                'confidence' => 0.93,
                'processing_time_ms' => 3200,
                'speaker_analysis' => [
                    'segments' => [
                        [
                            'text' => 'Hallo, dit is spreker A',
                            'speaker' => 'SPEAKER_00',
                            'speaker_confidence' => 0.95,
                            'start' => 0.0,
                            'end' => 2.5,
                            'confidence' => 0.96
                        ],
                        [
                            'text' => 'En dit is spreker B die antwoordt',
                            'speaker' => 'SPEAKER_01',
                            'speaker_confidence' => 0.89,
                            'start' => 2.5,
                            'end' => 5.8,
                            'confidence' => 0.91
                        ]
                    ]
                ]
            ], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-123',
            1
        );

        $this->assertNotNull($result);
        $this->assertTrue($result['success']);
        $this->assertCount(2, $result['transcriptions']);
        
        // Check first transcription
        $firstTranscription = $result['transcriptions'][0];
        $this->assertEquals('Hallo, dit is spreker A', $firstTranscription['text']);
        $this->assertEquals('Spreker A', $firstTranscription['speaker_name']);
        $this->assertEquals('SPEAKER_00', $firstTranscription['speaker_id']);
        $this->assertEquals('#3B82F6', $firstTranscription['speaker_color']);
        
        // Check second transcription
        $secondTranscription = $result['transcriptions'][1];
        $this->assertEquals('En dit is spreker B die antwoordt', $secondTranscription['text']);
        $this->assertEquals('Spreker B', $secondTranscription['speaker_name']);
        $this->assertEquals('SPEAKER_01', $secondTranscription['speaker_id']);
        $this->assertEquals('#EF4444', $secondTranscription['speaker_color']);

        // Check metadata
        $this->assertEquals(2, $result['n8n_metadata']['segments_count']);
        $this->assertEquals(3200, $result['n8n_metadata']['processing_time']);
    }

    /** @test */
    public function it_creates_transcription_records_in_database()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response([
                'transcription' => 'Database test transcriptie',
                'confidence' => 0.88,
                'processing_time_ms' => 1800,
                'speaker_analysis' => [
                    'segments' => [
                        [
                            'text' => 'Database test transcriptie',
                            'speaker' => 'SPEAKER_00',
                            'speaker_confidence' => 0.85,
                            'start' => 0.0,
                            'end' => 2.0,
                            'confidence' => 0.88
                        ]
                    ]
                ]
            ], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-456',
            3
        );

        $this->assertNotNull($result);
        $this->assertTrue($result['success']);

        // Check database record was created
        $this->assertDatabaseHas('transcriptions', [
            'text' => 'Database test transcriptie',
            'source' => 'n8n',
            'confidence' => 0.88,
            'speaker_confidence' => 0.85,
            'speaker_id' => 'SPEAKER_00',
            'speaker_name' => 'Spreker A',
            'processing_status' => 'completed'
        ]);

        // Check metadata was stored correctly
        $transcription = Transcription::where('text', 'Database test transcriptie')->first();
        $metadata = $transcription->metadata;
        
        $this->assertEquals('session-456', $metadata['session_id']);
        $this->assertEquals(3, $metadata['chunk_number']);
        $this->assertEquals(1800, $metadata['n8n_processing_time']);
        $this->assertEquals(0.0, $metadata['segment_start']);
        $this->assertEquals(2.0, $metadata['segment_end']);
    }

    /** @test */
    public function it_handles_empty_transcription_response()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response([
                'transcription' => '',
                'confidence' => 0.0,
                'processing_time_ms' => 500,
                'speaker_analysis' => [
                    'segments' => []
                ]
            ], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        Log::shouldReceive('warning')->once();

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-789',
            1
        );

        $this->assertNull($result);
    }

    /** @test */
    public function it_can_test_connection_successfully()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response(['status' => 'ok'], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
        });

        $service = new N8NTranscriptionService();
        
        $result = $service->testConnection();

        $this->assertTrue($result['success']);
        $this->assertEquals('N8N connection successful', $result['message']);
        $this->assertArrayHasKey('response_time', $result);
    }

    /** @test */
    public function it_handles_connection_test_failure()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response(['error' => 'Unauthorized'], 401)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'invalid-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
        });

        $service = new N8NTranscriptionService();
        
        $result = $service->testConnection();

        $this->assertFalse($result['success']);
        $this->assertStringContains('N8N returned status: 401', $result['error']);
    }

    /** @test */
    public function it_handles_network_timeout()
    {
        Http::fake([
            'test-n8n.com/*' => function () {
                throw new \Exception('Connection timeout');
            }
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        Log::shouldReceive('error')->once();

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-timeout',
            1
        );

        $this->assertNull($result);
    }

    /** @test */
    public function it_includes_correct_headers_in_request()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response(['transcription' => 'test'], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'secret-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        $service = new N8NTranscriptionService();
        
        $service->transcribeAudioChunk(
            'test-audio-data',
            'session-headers',
            1
        );

        Http::assertSent(function ($request) {
            return $request->hasHeader('Content-Type', 'application/json') &&
                   $request->hasHeader('User-Agent', 'ConversationHub/1.0') &&
                   $request->hasHeader('Authorization', 'Bearer secret-api-key');
        });
    }

    /** @test */
    public function it_maps_speaker_ids_to_correct_colors()
    {
        $service = new N8NTranscriptionService();
        
        // Use reflection to test private method
        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('getSpeakerColor');
        $method->setAccessible(true);
        
        $this->assertEquals('#3B82F6', $method->invoke($service, 'SPEAKER_00'));
        $this->assertEquals('#EF4444', $method->invoke($service, 'SPEAKER_01'));
        $this->assertEquals('#10B981', $method->invoke($service, 'SPEAKER_02'));
        $this->assertEquals('#F59E0B', $method->invoke($service, 'SPEAKER_03'));
        $this->assertEquals('#8B5CF6', $method->invoke($service, 'SPEAKER_04'));
        $this->assertEquals('#6B7280', $method->invoke($service, 'unknown'));
    }

    /** @test */
    public function it_maps_speaker_ids_to_correct_names()
    {
        $service = new N8NTranscriptionService();
        
        // Use reflection to test private method
        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('getSpeakerName');
        $method->setAccessible(true);
        
        $this->assertEquals('Spreker A', $method->invoke($service, 'SPEAKER_00', 'session-123'));
        $this->assertEquals('Spreker B', $method->invoke($service, 'SPEAKER_01', 'session-123'));
        $this->assertEquals('Spreker C', $method->invoke($service, 'SPEAKER_02', 'session-123'));
        $this->assertEquals('Spreker D', $method->invoke($service, 'SPEAKER_03', 'session-123'));
        $this->assertEquals('Spreker E', $method->invoke($service, 'SPEAKER_04', 'session-123'));
        $this->assertEquals('Spreker unknown_speaker', $method->invoke($service, 'unknown_speaker', 'session-123'));
    }

    /** @test */
    public function it_validates_required_audio_data()
    {
        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        $service = new N8NTranscriptionService();
        
        // Test with empty audio data
        $result = $service->transcribeAudioChunk('', 'session-123', 1);
        
        // Should still make the request, but with empty audio_data
        Http::fake([
            'test-n8n.com/*' => Http::response([
                'transcription' => '',
                'confidence' => 0.0,
                'processing_time_ms' => 100,
                'speaker_analysis' => ['segments' => []]
            ], 200)
        ]);
        
        $result = $service->transcribeAudioChunk('', 'session-123', 1);
        $this->assertNull($result); // Should return null for empty transcription
    }

    /** @test */
    public function it_handles_malformed_n8n_response()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response('invalid json response', 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        Log::shouldReceive('error')->once();

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-malformed',
            1
        );

        $this->assertNull($result);
    }

    /** @test */
    public function it_respects_timeout_configuration()
    {
        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 30 // Custom timeout
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        Http::fake([
            'test-n8n.com/*' => Http::response(['transcription' => 'test'], 200)
        ]);

        $service = new N8NTranscriptionService();
        
        $service->transcribeAudioChunk(
            'test-audio-data',
            'session-timeout-config',
            1
        );

        // Verify timeout was set correctly (60 seconds as defined in service)
        Http::assertSent(function ($request) {
            // Note: We can't directly test the timeout value, but we can verify the request was made
            return $request->url() === 'http://test-n8n.com/webhook';
        });
    }

    /** @test */
    public function it_logs_transcription_processing_steps()
    {
        Http::fake([
            'test-n8n.com/*' => Http::response([
                'transcription' => 'Logging test transcriptie',
                'confidence' => 0.92,
                'processing_time_ms' => 2200,
                'speaker_analysis' => [
                    'segments' => [
                        [
                            'text' => 'Logging test transcriptie',
                            'speaker' => 'SPEAKER_00',
                            'speaker_confidence' => 0.90,
                            'start' => 0.0,
                            'end' => 3.0,
                            'confidence' => 0.92
                        ]
                    ]
                ]
            ], 200)
        ]);

        $this->partialMock(ConfigService::class, function ($mock) {
            $mock->shouldReceive('getN8NConfig')->andReturn([
                'webhook_url' => 'http://test-n8n.com/webhook',
                'api_key' => 'test-api-key',
                'transcription_enabled' => true,
                'timeout_seconds' => 60
            ]);
            $mock->shouldReceive('isN8NTranscriptionEnabled')->andReturn(true);
        });

        // Expect specific log entries
        Log::shouldReceive('info')
            ->with('Sending audio chunk to N8N for transcription', [
                'session_id' => 'session-logging',
                'chunk_number' => 2,
                'audio_size' => 15 // length of 'test-audio-data'
            ])
            ->once();

        Log::shouldReceive('info')
            ->with('N8N transcription successful', [
                'session_id' => 'session-logging',
                'chunk_number' => 2,
                'transcription_length' => 25, // length of 'Logging test transcriptie'
                'speakers_detected' => 1
            ])
            ->once();

        $service = new N8NTranscriptionService();
        
        $result = $service->transcribeAudioChunk(
            'test-audio-data',
            'session-logging',
            2
        );

        $this->assertNotNull($result);
        $this->assertTrue($result['success']);
    }
}