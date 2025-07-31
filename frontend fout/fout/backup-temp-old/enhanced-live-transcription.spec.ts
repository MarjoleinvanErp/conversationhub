import { test, expect, Page } from '@playwright/test';

/**
 * Enhanced Live Transcription E2E Tests
 * Tests the complete user journey for live transcription functionality
 */

test.describe('Enhanced Live Transcription', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Grant microphone permissions
    await page.context().grantPermissions(['microphone']);
    
    // Navigate to meeting room with test data
    await page.goto('/meeting-room/test-meeting-123');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Session Management', () => {
    test('should start and stop transcription session successfully', async () => {
      // Should show session setup initially
      await expect(page.locator('[data-testid="session-setup"]')).toBeVisible();
      await expect(page.locator('text=Start Enhanced Session')).toBeVisible();

      // Start session without voice setup
      await page.click('[data-testid="start-session-button"]');

      // Should show loading state
      await expect(page.locator('text=Initialiseren...')).toBeVisible();
      
      // Wait for session to start
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Sessie: session')).toBeVisible();

      // Should show recording controls
      await expect(page.locator('[data-testid="start-recording-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="recording-status"]')).toBeVisible();

      // Stop session
      await page.click('[data-testid="stop-session-button"]');
      
      // Should return to setup
      await expect(page.locator('[data-testid="session-setup"]')).toBeVisible();
    });

    test('should handle session start errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/live-transcription/enhanced/start', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: 'Server error' })
        });
      });

      await page.click('[data-testid="start-session-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
      await expect(page.locator('text=Server error')).toBeVisible();

      // Should show retry option
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should validate required participants', async () => {
      // Navigate to meeting without participants
      await page.goto('/meeting-room/empty-meeting');
      
      await page.click('[data-testid="start-session-button"]');

      // Should show validation error
      await expect(page.locator('text=At least one participant is required')).toBeVisible();
    });
  });

  test.describe('Audio Recording', () => {
    test.beforeEach(async () => {
      // Start session first
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
    });

    test('should start and stop audio recording', async () => {
      // Start recording
      await page.click('[data-testid="start-recording-button"]');

      // Should show recording state
      await expect(page.locator('text=Opname Actief')).toBeVisible();
      await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();
      await expect(page.locator('[data-testid="stop-recording-button"]')).toBeVisible();

      // Timer should be running
      await page.waitForTimeout(2000);
      await expect(page.locator('text=0:02')).toBeVisible();

      // Stop recording
      await page.click('[data-testid="stop-recording-button"]');

      // Should return to ready state
      await expect(page.locator('text=Klaar om op te nemen')).toBeVisible();
      await expect(page.locator('[data-testid="start-recording-button"]')).toBeVisible();
    });

    test('should pause and resume recording', async () => {
      // Start recording
      await page.click('[data-testid="start-recording-button"]');
      await expect(page.locator('text=Opname Actief')).toBeVisible();

      // Pause recording
      await page.click('[data-testid="pause-recording-button"]');
      await expect(page.locator('text=Gepauzeerd')).toBeVisible();
      await expect(page.locator('[data-testid="resume-recording-button"]')).toBeVisible();

      // Resume recording
      await page.click('[data-testid="resume-recording-button"]');
      await expect(page.locator('text=Opname Actief')).toBeVisible();
      await expect(page.locator('[data-testid="pause-recording-button"]')).toBeVisible();
    });

    test('should show browser support warnings', async () => {
      // Mock unsupported browser
      await page.addInitScript(() => {
        delete (window as any).SpeechRecognition;
        delete (window as any).webkitSpeechRecognition;
      });

      await page.reload();
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });

      // Should show warning about browser support
      await expect(page.locator('text=Browser Speech Recognition niet ondersteund')).toBeVisible();
    });
  });

  test.describe('Voice Setup Workflow', () => {
    test('should complete voice setup for multiple participants', async () => {
      // Start session with voice setup
      await page.click('[data-testid="start-session-voice-button"]');
      
      // Should show voice setup interface
      await expect(page.locator('[data-testid="voice-setup"]')).toBeVisible();
      await expect(page.locator('text=Spreker 1 van')).toBeVisible();

      // Record voice profile for first participant
      await page.click('[data-testid="record-voice-button"]');
      await expect(page.locator('text=Opname actief... Zeg enkele zinnen')).toBeVisible();

      // Simulate voice recording completion
      await page.waitForTimeout(3000);
      await page.click('[data-testid="voice-setup-next-button"]');

      // Should move to next participant
      await expect(page.locator('text=Spreker 2 van')).toBeVisible();

      // Skip second participant
      await page.click('[data-testid="voice-setup-skip-button"]');

      // Should complete setup and start recording
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible();
      await expect(page.locator('text=Opname Actief')).toBeVisible();
    });

    test('should allow skipping voice setup entirely', async () => {
      // Start session with voice setup
      await page.click('[data-testid="start-session-voice-button"]');
      await expect(page.locator('[data-testid="voice-setup"]')).toBeVisible();

      // Skip voice setup immediately
      await page.click('[data-testid="voice-setup-skip-all-button"]');

      // Should go directly to recording controls
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="start-recording-button"]')).toBeVisible();
    });
  });

  test.describe('Transcription Display', () => {
    test.beforeEach(async () => {
      // Start session and recording
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
      await page.click('[data-testid="start-recording-button"]');
    });

    test('should display live transcriptions as they arrive', async () => {
      // Mock transcription responses
      await page.route('**/api/live-transcription/process-live', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            transcription: {
              id: 'trans-1',
              text: 'Hello, this is a test transcription',
              speaker_name: 'John Doe',
              speaker_id: 'participant_1',
              speaker_color: '#FF5722',
              confidence: 0.95,
              spoken_at: new Date().toISOString(),
              source: 'live',
              processing_status: 'completed'
            }
          })
        });
      });

      // Should show transcription output area
      await expect(page.locator('[data-testid="transcription-output"]')).toBeVisible();

      // Wait for transcriptions to appear
      await expect(page.locator('[data-testid="transcription-item"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Hello, this is a test transcription')).toBeVisible();

      // Should show speaker information
      await expect(page.locator('text=John Doe')).toBeVisible();
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    });

    test('should show empty state when no transcriptions', async () => {
      // Should show empty state initially
      await expect(page.locator('[data-testid="transcription-empty-state"]')).toBeVisible();
      await expect(page.locator('text=Nog geen transcripties...')).toBeVisible();
      await expect(page.locator('text=Start opname om transcripties te zien')).toBeVisible();
    });

    test('should display different transcription sources', async () => {
      // Mock different transcription sources
      const transcriptions = [
        {
          id: 'trans-1',
          text: 'Live transcription from browser',
          source: 'live',
          speaker_name: 'Speaker 1'
        },
        {
          id: 'trans-2', 
          text: 'Whisper API transcription',
          source: 'whisper',
          speaker_name: 'Speaker 2'
        }
      ];

      for (const [index, transcription] of transcriptions.entries()) {
        await page.route('**/api/live-transcription/process-live', route => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              transcription: {
                ...transcription,
                speaker_id: `participant_${index + 1}`,
                speaker_color: index === 0 ? '#FF5722' : '#2196F3',
                confidence: 0.9,
                spoken_at: new Date().toISOString(),
                processing_status: 'completed'
              }
            })
          });
        });
      }

      // Should show both transcriptions with different source indicators
      await expect(page.locator('text=Live transcription from browser')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Whisper API transcription')).toBeVisible();
    });
  });

  test.describe('Recording Statistics', () => {
    test.beforeEach(async () => {
      // Start session and recording
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
      await page.click('[data-testid="start-recording-button"]');
    });

    test('should display recording statistics', async () => {
      await expect(page.locator('[data-testid="recording-status"]')).toBeVisible();
      
      // Should show recording duration
      await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();
      await expect(page.locator('text=0:00')).toBeVisible();

      // Wait for timer to update
      await page.waitForTimeout(2000);
      await expect(page.locator('text=0:02')).toBeVisible();

      // Should show processing statistics
      await expect(page.locator('[data-testid="chunks-processed"]')).toBeVisible();
      await expect(page.locator('[data-testid="transcriptions-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-service"]')).toBeVisible();
    });

    test('should update statistics as transcriptions are processed', async () => {
      // Mock multiple transcription responses
      let transcriptionCount = 0;
      
      await page.route('**/api/live-transcription/process-live', route => {
        transcriptionCount++;
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            transcription: {
              id: `trans-${transcriptionCount}`,
              text: `Transcription number ${transcriptionCount}`,
              speaker_name: 'Test Speaker',
              speaker_id: 'participant_1',
              speaker_color: '#FF5722',
              confidence: 0.9,
              spoken_at: new Date().toISOString(),
              source: 'live',
              processing_status: 'completed'
            },
            processing_details: {
              processing_time: 150,
              service_used: 'whisper',
              chunk_number: transcriptionCount
            }
          })
        });
      });

      // Wait for statistics to update
      await page.waitForTimeout(5000);
      
      // Should show updated counts
      await expect(page.locator('[data-testid="transcriptions-count"]')).toContainText('1');
      await expect(page.locator('[data-testid="chunks-processed"]')).toContainText('1');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Start session successfully
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });

      // Mock recording start failure
      await page.route('**/api/live-transcription/enhanced/start-recording', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            error: 'Microphone access denied'
          })
        });
      });

      await page.click('[data-testid="start-recording-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
      await expect(page.locator('text=Microphone access denied')).toBeVisible();

      // Should remain in ready state
      await expect(page.locator('[data-testid="start-recording-button"]')).toBeVisible();
    });

    test('should handle network connectivity issues', async () => {
      // Start session and recording
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
      await page.click('[data-testid="start-recording-button"]');

      // Simulate network failure during transcription
      await page.route('**/api/live-transcription/process-live', route => {
        route.abort('failed');
      });

      // Should show processing error
      await expect(page.locator('text=Network connection failed')).toBeVisible({ timeout: 20000 });

      // Should still allow stopping recording
      await expect(page.locator('[data-testid="stop-recording-button"]')).toBeEnabled();
    });

    test('should clear errors when user retries', async () => {
      // Create an error state
      await page.route('**/api/live-transcription/enhanced/start', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: 'Server error' })
        });
      });

      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();

      // Clear the route to allow success
      await page.unroute('**/api/live-transcription/enhanced/start');

      // Retry should clear error
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="error-alert"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      // Should be able to navigate with keyboard
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="start-session-button"]')).toBeFocused();

      // Start session with keyboard
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });

      // Navigate to recording button
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="start-recording-button"]')).toBeFocused();

      // Start recording with keyboard
      await page.keyboard.press('Enter');
      await expect(page.locator('text=Opname Actief')).toBeVisible();
    });

    test('should have proper ARIA labels', async () => {
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });

      // Check ARIA labels
      await expect(page.locator('[data-testid="start-recording-button"]')).toHaveAttribute('aria-label', 'Start audio opname');
      await expect(page.locator('[data-testid="recording-status"]')).toHaveAttribute('aria-live', 'polite');
    });

    test('should announce status changes to screen readers', async () => {
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });

      // Start recording
      await page.click('[data-testid="start-recording-button"]');

      // Should have aria-live region for status updates
      await expect(page.locator('[aria-live="polite"]')).toContainText('Opname Actief');
    });
  });

  test.describe('Performance', () => {
    test('should handle large numbers of transcriptions efficiently', async () => {
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
      await page.click('[data-testid="start-recording-button"]');

      // Mock rapid transcription responses
      let transcriptionCount = 0;
      await page.route('**/api/live-transcription/process-live', route => {
        transcriptionCount++;
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            transcription: {
              id: `trans-${transcriptionCount}`,
              text: `Rapid transcription ${transcriptionCount}`,
              speaker_name: 'Test Speaker',
              speaker_id: 'participant_1',
              speaker_color: '#FF5722',
              confidence: 0.9,
              spoken_at: new Date().toISOString(),
              source: 'live',
              processing_status: 'completed'
            }
          })
        });
      });

      // Component should remain responsive with many transcriptions
      await page.waitForTimeout(10000);
      
      // Should still be able to interact with controls
      await expect(page.locator('[data-testid="stop-recording-button"]')).toBeEnabled();
      
      // Should not cause memory leaks or performance issues
      const memoryUsage = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  test.describe('Integration', () => {
    test('should work end-to-end with real API calls', async () => {
      // Skip mocking for real integration test
      await page.click('[data-testid="start-session-button"]');
      await expect(page.locator('[data-testid="recording-controls"]')).toBeVisible({ timeout: 10000 });
      
      await page.click('[data-testid="start-recording-button"]');
      await expect(page.locator('text=Opname Actief')).toBeVisible();
      
      // Let it record for a few seconds
      await page.waitForTimeout(5000);
      
      // Stop recording
      await page.click('[data-testid="stop-recording-button"]');
      await expect(page.locator('text=Klaar om op te nemen')).toBeVisible();
      
      // Should have processed some chunks
      await expect(page.locator('[data-testid="chunks-processed"]')).not.toContainText('0');
    });
  });
});name: 'Test Speaker',
              speaker_id: 'participant_1',
              speaker_color: '#FF5722',
              confidence: 0.9,
              spoken_at: new Date().toISOString(),
              source: 'live',
              processing_status: 'completed'
            }
          })
        });
      });

      // Component should remain responsive with many transcriptions
      await page.waitForTimeout(10000);
      
      // Should still be able to interact with controls
      await expect(page.locator('[data-testid="stop-recording-button"]')).toBeEnabled();
      
      // Should not cause memory leaks or performance issues
      const memoryUsage = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });
});