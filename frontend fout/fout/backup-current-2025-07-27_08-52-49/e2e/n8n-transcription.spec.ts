// frontend/e2e/n8n-transcription.spec.ts

import { test, expect, Page } from '@playwright/test';
import type { N8NTranscriptionResponse, ProcessChunkResult } from '../src/types/n8n';

// Mock N8N responses for testing
const mockN8NResponse: N8NTranscriptionResponse = {
  transcription: 'Dit is een test transcriptie van N8N workflow',
  confidence: 0.95,
  processing_time_ms: 2500,
  speaker_analysis: {
    segments: [
      {
        text: 'Dit is spreker A',
        speaker: 'SPEAKER_00',
        speaker_confidence: 0.92,
        start: 0.0,
        end: 2.5,
        confidence: 0.94
      },
      {
        text: 'En dit is spreker B',
        speaker: 'SPEAKER_01', 
        speaker_confidence: 0.89,
        start: 2.5,
        end: 5.0,
        confidence: 0.91
      }
    ]
  }
};

test.describe('N8N Transcription Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API responses
    await page.route('**/api/transcription/config', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            live_webspeech_enabled: true,
            whisper_enabled: true,
            whisper_chunk_duration: 90,
            n8n_transcription_enabled: true,
            default_transcription_service: 'auto',
            available_services: {
              whisper: true,
              n8n: true
            },
            n8n_enabled: true,
            n8n_webhook_configured: true
          }
        }
      });
    });

    await page.route('**/api/transcription/test-services', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            whisper: {
              available: true,
              status: 'Whisper service configured'
            },
            n8n: {
              available: true,
              status: 'Connected',
              success: true,
              response_time: 150
            }
          }
        }
      });
    });

    await page.route('**/api/config', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            transcription: {
              live_webspeech_enabled: true,
              whisper_enabled: true,
              whisper_chunk_duration: 90,
              n8n_transcription_enabled: true,
              default_transcription_service: 'auto'
            },
            n8n: {
              auto_export_enabled: false,
              auto_export_interval_minutes: 10,
              webhook_url: 'http://test-n8n.com/webhook',
              api_key: 'test-key',
              transcription_enabled: true,
              transcription_webhook_url: 'http://test-n8n.com/transcription',
              timeout_seconds: 60
            },
            privacy: {
              filter_enabled: true,
              data_retention_days: 90,
              auto_delete_audio: true
            },
            azure: {
              whisper_configured: true
            }
          }
        }
      });
    });

    // Mock getUserMedia for audio recording
    await page.addInitScript(() => {
      const mockStream = {
        getTracks: () => [{ stop: () => {} }],
        getAudioTracks: () => [{ stop: () => {} }]
      };

      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: () => Promise.resolve(mockStream)
        }
      });

      // Mock MediaRecorder
      (window as any).MediaRecorder = class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;
        
        constructor() {}
        
        start() {
          this.state = 'recording';
          // Simulate data available after short delay
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['fake-audio-data'], { type: 'audio/webm' }) });
            }
          }, 1000);
        }
        
        stop() {
          this.state = 'inactive';
        }
        
        pause() {
          this.state = 'paused';
        }
        
        resume() {
          this.state = 'recording';
        }
        
        static isTypeSupported() {
          return true;
        }
      };

      // Mock SpeechRecognition
      (window as any).SpeechRecognition = class MockSpeechRecognition {
        continuous = true;
        interimResults = true;
        lang = 'nl-NL';
        onresult: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;
        onend: ((event: any) => void) | null = null;
        
        start() {
          // Simulate speech recognition result after delay
          setTimeout(() => {
            if (this.onresult) {
              this.onresult({
                resultIndex: 0,
                results: [{
                  0: { transcript: 'Live spraakherkenning test', confidence: 0.87 },
                  isFinal: true
                }]
              });
            }
          }, 2000);
        }
        
        stop() {}
      };
      
      (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
    });

    // Navigate to the transcription page
    await page.goto('http://localhost:3000/transcription');
  });

  test('should display N8N service status correctly', async ({ page }) => {
    // Wait for component to load
    await expect(page.locator('text=Live Transcriptie')).toBeVisible();
    
    // Check that both service indicators are visible
    await expect(page.locator('text=WHISPER')).toBeVisible();
    await expect(page.locator('text=N8N')).toBeVisible();
    
    // Both services should show as available (green check icons)
    await expect(page.locator('[data-testid="whisper-status-icon"]')).toHaveClass(/text-green-600/);
    await expect(page.locator('[data-testid="n8n-status-icon"]')).toHaveClass(/text-green-600/);
  });

  test('should allow service selection', async ({ page }) => {
    // Open service selector
    await page.click('[title="Transcriptie instellingen"]');
    
    // Should show service selection UI
    await expect(page.locator('text=Transcriptie Service')).toBeVisible();
    await expect(page.locator('text=Auto')).toBeVisible();
    await expect(page.locator('text=Whisper')).toBeVisible(); 
    await expect(page.locator('text=N8n')).toBeVisible();
    
    // Mock the preferred service API call
    await page.route('**/api/transcription/preferred-service', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            session_id: 'test-session',
            preferred_service: 'n8n'
          }
        }
      });
    });
    
    // Select N8N service
    await page.click('text=N8n');
    
    // Should highlight the selected service
    await expect(page.locator('text=N8n').locator('..')).toHaveClass(/bg-blue-50/);
  });

  test('should start recording and show appropriate UI changes', async ({ page }) => {
    // Mock the start recording API call
    await page.route('**/api/transcription/live', async route => {
      // Simulate successful N8N transcription response
      const mockResult: ProcessChunkResult = {
        success: true,
        transcription: {
          id: 1,
          text: 'Dit is een test transcriptie van N8N',
          speaker_name: 'Spreker A',
          speaker_id: 'SPEAKER_00',
          speaker_color: '#3B82F6',
          confidence: 0.95,
          speaker_confidence: 0.92,
          spoken_at: new Date().toISOString(),
          source: 'n8n',
          processing_status: 'completed'
        },
        transcriptions: [
          {
            id: 1,
            text: 'Dit is een test transcriptie van N8N',
            speaker_name: 'Spreker A',
            speaker_id: 'SPEAKER_00',
            speaker_color: '#3B82F6',
            confidence: 0.95,
            speaker_confidence: 0.92,
            spoken_at: new Date().toISOString(),
            source: 'n8n',
            processing_status: 'completed'
          }
        ],
        primary_source: 'n8n',
        session_stats: {
          total_chunks: 1,
          voice_setup_complete: true,
          n8n_enabled: true,
          whisper_enabled: true,
          last_successful_service: 'n8n'
        }
      };

      await route.fulfill({
        json: {
          success: true,
          data: mockResult
        }
      });
    });

    // Initial state should show "Start Opname" button
    await expect(page.locator('text=Start Opname')).toBeVisible();
    await expect(page.locator('text=Klaar om op te nemen')).toBeVisible();

    // Click start recording
    await page.click('text=Start Opname');

    // Should show recording controls
    await expect(page.locator('text=Pauzeer')).toBeVisible();
    await expect(page.locator('text=Stop')).toBeVisible();
    await expect(page.locator('text=Start Opname')).not.toBeVisible();

    // Should show recording status
    await expect(page.locator('text=Opname actief')).toBeVisible();

    // Should show statistics section
    await expect(page.locator('text=Statistieken')).toBeVisible();
    await expect(page.locator('text=Opnameduur:')).toBeVisible();
    await expect(page.locator('text=Chunks verwerkt:')).toBeVisible();
    await expect(page.locator('text=Transcripties:')).toBeVisible();
  });

  test('should process N8N transcription with speaker segments', async ({ page }) => {
    // Mock successful chunk processing with multiple speaker segments
    await page.route('**/api/transcription/live', async route => {
      const mockResult: ProcessChunkResult = {
        success: true,
        transcriptions: [
          {
            id: 1,
            text: 'Dit is spreker A',
            speaker_name: 'Spreker A',
            speaker_id: 'SPEAKER_00',
            speaker_color: '#3B82F6',
            confidence: 0.94,
            speaker_confidence: 0.92,
            spoken_at: new Date().toISOString(),
            source: 'n8n',
            processing_status: 'completed'
          },
          {
            id: 2,
            text: 'En dit is spreker B',
            speaker_name: 'Spreker B',
            speaker_id: 'SPEAKER_01',
            speaker_color: '#EF4444',
            confidence: 0.91,
            speaker_confidence: 0.89,
            spoken_at: new Date().toISOString(),
            source: 'n8n',
            processing_status: 'completed'
          }
        ],
        transcription: {
          id: 1,
          text: 'Dit is spreker A',
          speaker_name: 'Spreker A',
          speaker_id: 'SPEAKER_00',
          speaker_color: '#3B82F6',
          confidence: 0.94,
          speaker_confidence: 0.92,
          spoken_at: new Date().toISOString(),
          source: 'n8n',
          processing_status: 'completed'
        },
        primary_source: 'n8n',
        session_stats: {
          total_chunks: 1,
          voice_setup_complete: true,
          n8n_enabled: true,
          whisper_enabled: true,
          last_successful_service: 'n8n'
        }
      };

      await route.fulfill({
        json: {
          success: true,
          data: mockResult
        }
      });
    });

    // Start recording
    await page.click('text=Start Opname');

    // Wait for chunk processing simulation (should happen automatically)
    await page.waitForTimeout(3000);

    // Should display transcriptions section
    await expect(page.locator('text=Live Transcripties')).toBeVisible();

    // Should show both speaker segments
    await expect(page.locator('text=Dit is spreker A')).toBeVisible();
    await expect(page.locator('text=En dit is spreker B')).toBeVisible();

    // Should show speaker names
    await expect(page.locator('text=Spreker A')).toBeVisible();
    await expect(page.locator('text=Spreker B')).toBeVisible();

    // Should show N8N as source
    await expect(page.locator('text=N8N').first()).toBeVisible();

    // Should show confidence scores
    await expect(page.locator('text=94%')).toBeVisible();
    await expect(page.locator('text=91%')).toBeVisible();
  });

  test('should handle N8N service failure gracefully', async ({ page }) => {
    // Mock N8N service as unavailable
    await page.route('**/api/transcription/test-services', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            whisper: {
              available: true,
              status: 'Whisper service configured'
            },
            n8n: {
              available: false,
              status: 'Connection failed',
              success: false,
              error: 'Webhook not reachable'
            }
          }
        }
      });
    });

    // Reload page to get updated service status
    await page.reload();

    // N8N should show as unavailable
    await expect(page.locator('[data-testid="n8n-status-icon"]')).toHaveClass(/text-red-600/);

    // Open service selector
    await page.click('[title="Transcriptie instellingen"]');

    // N8N service should be disabled
    await expect(page.locator('text=N8n')).toBeDisabled();

    // Should still be able to select other services
    await expect(page.locator('text=Auto')).not.toBeDisabled();
    await expect(page.locator('text=Whisper')).not.toBeDisabled();
  });

  test('should show processing status during chunk processing', async ({ page }) => {
    let requestCount = 0;
    
    // Mock delayed N8N response to simulate processing time
    await page.route('**/api/transcription/live', async route => {
      requestCount++;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: ProcessChunkResult = {
        success: true,
        transcription: {
          id: requestCount,
          text: `Transcriptie chunk ${requestCount} verwerkt door N8N`,
          speaker_name: 'Spreker A',
          speaker_id: 'SPEAKER_00',
          speaker_color: '#3B82F6',
          confidence: 0.95,
          speaker_confidence: 0.92,
          spoken_at: new Date().toISOString(),
          source: 'n8n',
          processing_status: 'completed'
        },
        primary_source: 'n8n',
        session_stats: {
          total_chunks: requestCount,
          voice_setup_complete: true,
          n8n_enabled: true,
          whisper_enabled: true
        }
      };

      await route.fulfill({
        json: {
          success: true,
          data: mockResult
        }
      });
    });

    // Select N8N as preferred service
    await page.click('[title="Transcriptie instellingen"]');
    await page.click('text=N8n');

    // Start recording
    await page.click('text=Start Opname');

    // Should show processing status
    await expect(page.locator('text=Verwerking audio chunk')).toBeVisible();
    await expect(page.locator('text=met auto')).toBeVisible();

    // Wait for processing to complete
    await page.waitForTimeout(3000);

    // Should show completed transcription
    await expect(page.locator('text=Transcriptie chunk 1 verwerkt door N8N')).toBeVisible();
  });

  test('should display correct service statistics', async ({ page }) => {
    // Start recording to show statistics
    await page.click('text=Start Opname');

    // Should show statistics with correct initial values
    await expect(page.locator('text=Opnameduur:')).toBeVisible();
    await expect(page.locator('text=0:00')).toBeVisible();
    
    await expect(page.locator('text=Chunks verwerkt:')).toBeVisible();
    await expect(page.locator('text=0').first()).toBeVisible();
    
    await expect(page.locator('text=Transcripties:')).toBeVisible();
    await expect(page.locator('text=Service:')).toBeVisible();
    await expect(page.locator('text=Auto')).toBeVisible();

    // Wait for duration to increment
    await page.waitForTimeout(2000);
    await expect(page.locator('text=0:02')).toBeVisible();
  });

  test('should handle settings page N8N configuration display', async ({ page }) => {
    // Navigate to settings page
    await page.goto('http://localhost:3000/settings');

    // Should show N8N integration section
    await expect(page.locator('text=N8N Integratie')).toBeVisible();
    
    // Should show N8N transcription status
    await expect(page.locator('text=N8N Transcriptie')).toBeVisible();
    await expect(page.locator('text=Ingeschakeld')).toBeVisible();
    
    // Should show webhook configuration status
    await expect(page.locator('text=Webhook: Geconfigureerd')).toBeVisible();
    
    // Should show service priority section
    await expect(page.locator('text=Service Prioriteit')).toBeVisible();
    await expect(page.locator('text=N8N workflow met speaker diarization')).toBeVisible();

    // Test services button should be present
    await expect(page.locator('text=Test Services')).toBeVisible();
  });

  test('should test N8N connection from settings page', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');

    // Mock successful connection test
    await page.route('**/api/transcription/test-services', async route => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            whisper: {
              available: true,
              status: 'Whisper service configured'
            },
            n8n: {
              available: true,
              status: 'Connected',
              success: true,
              response_time: 125,
              message: 'N8N connection successful'
            }
          }
        }
      });
    });

    // Click test services button
    await page.click('text=Test Services');

    // Should show testing state briefly
    await expect(page.locator('text=Testen...')).toBeVisible();

    // Wait for test completion
    await page.waitForTimeout(1000);

    // Should show successful connection details
    await expect(page.locator('text=Verbonden')).toBeVisible();
    await expect(page.locator('text=125ms')).toBeVisible();
  });
});