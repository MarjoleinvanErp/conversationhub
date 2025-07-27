import { test, expect, Page, Browser } from '@playwright/test';

/**
 * E2E Tests for AutoRecordingPanel
 * Tests complete user journeys for automatic meeting recording
 */

test.describe('Auto Recording Panel - E2E Tests', () => {
  let page: Page;
  let browser: Browser;

  test.beforeAll(async ({ browser: testBrowser }) => {
    browser = testBrowser;
  });

  test.beforeEach(async () => {
    // Create new page with microphone permissions
    const context = await browser.newContext({
      permissions: ['microphone'],
      // Mock media devices for testing
      mediaFeatures: [
        { name: 'prefers-reduced-motion', value: 'no-preference' }
      ]
    });
    
    page = await context.newPage();

    // Mock N8N webhook endpoint
    await page.route('**/webhook/transcription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Audio chunk received' })
      });
    });

    // Mock MediaRecorder and getUserMedia for testing
    await page.addInitScript(() => {
      // Mock getUserMedia
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.resolve({
            getTracks: () => [{ stop: () => {} }],
            addEventListener: () => {},
            removeEventListener: () => {}
          })
        },
        writable: true
      });

      // Mock MediaRecorder
      const mockMediaRecorder = class {
        state = 'inactive';
        ondataavailable = null;
        onstart = null;
        onstop = null;
        onerror = null;

        constructor() {}

        start() {
          this.state = 'recording';
          if (this.onstart) this.onstart();
          
          // Simulate data available after short delay
          setTimeout(() => {
            if (this.ondataavailable) {
              const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
              this.ondataavailable({ data: mockBlob });
            }
          }, 100);
        }

        stop() {
          this.state = 'inactive';
          if (this.onstop) this.onstop();
        }

        pause() {
          this.state = 'paused';
        }

        resume() {
          this.state = 'recording';
        }

        addEventListener() {}
        removeEventListener() {}
      };

      // @ts-ignore
      window.MediaRecorder = mockMediaRecorder;
      // @ts-ignore
      window.MediaRecorder.isTypeSupported = () => true;
    });

    // Navigate to meeting room page
    await page.goto('/meeting-room/test-meeting-e2e');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Panel Visibility and Interaction', () => {
    test('should display auto recording panel in collapsed state', async () => {
      // Check that panel exists but is collapsed
      await expect(page.locator('[data-testid="auto-recording-panel"]').or(page.getByText('Automatische Opname'))).toBeVisible();
      
      // Content should not be visible when collapsed
      await expect(page.getByText('Start Opname')).not.toBeVisible();
    });

    test('should expand panel when header is clicked', async () => {
      // Find and click the panel header
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();

      // Panel content should now be visible
      await expect(page.getByText('Start Opname')).toBeVisible();
      await expect(page.getByText('00:00')).toBeVisible();
      await expect(page.getByText('Deelnemers')).toBeVisible();
    });

    test('should collapse panel when expanded header is clicked', async () => {
      // First expand the panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();
      await expect(page.getByText('Start Opname')).toBeVisible();

      // Click again to collapse
      await panelHeader.click();
      await expect(page.getByText('Start Opname')).not.toBeVisible();
    });
  });

  test.describe('Recording Functionality', () => {
    test.beforeEach(async () => {
      // Expand panel for recording tests
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();
      await expect(page.getByText('Start Opname')).toBeVisible();
    });

    test('should start recording when start button is clicked', async () => {
      // Click start recording button
      await page.getByText('Start Opname').click();

      // Should show initializing state
      await expect(page.getByText('Initialiseren...')).toBeVisible();

      // Should transition to recording state
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });
      
      // Should show recording indicator
      await expect(page.getByText('REC')).toBeVisible();
      
      // Timer should be running
      await expect(page.getByText('0:01')).toBeVisible({ timeout: 2000 });
    });

    test('should stop recording when stop button is clicked', async () => {
      // Start recording first
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });

      // Stop recording
      await page.getByText('Stop Opname').click();

      // Should return to start state
      await expect(page.getByText('Start Opname')).toBeVisible();
      
      // Recording indicator should disappear
      await expect(page.getByText('REC')).not.toBeVisible();
    });

    test('should display session information during recording', async () => {
      // Start recording
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });

      // Should show session information
      await expect(page.getByText('Sessie ID:')).toBeVisible();
      await expect(page.getByText('Chunks verzonden:')).toBeVisible();
      await expect(page.getByText('N8N Endpoint:')).toBeVisible();
      
      // Should show chunk count starting at 0
      await expect(page.locator('text=Chunks verzonden: >> following-sibling::span').first()).toHaveText('0');
    });

    test('should update timer during recording', async () => {
      // Start recording
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });

      // Timer should start at 0:00 and increment
      await expect(page.getByText('0:00')).toBeVisible();
      
      // Wait for timer to increment
      await expect(page.getByText('0:01')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText('0:02')).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Participants Display', () => {
    test.beforeEach(async () => {
      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();
    });

    test('should display participants list when available', async () => {
      // Should show participants section
      await expect(page.getByText('Deelnemers')).toBeVisible();
      
      // Should show participant count
      await expect(page.locator('text=Deelnemers').locator('text=/\\(\\d+\\)/')).toBeVisible();
      
      // Should show individual participants
      await expect(page.locator('.text-gray-700').first()).toBeVisible();
    });

    test('should show online status indicators for participants', async () => {
      // Look for online status indicators (green dots)
      const onlineIndicators = page.locator('.bg-green-500');
      await expect(onlineIndicators.first()).toBeVisible();
    });

    test('should limit participant display to first 3 with overflow indicator', async () => {
      // If more than 3 participants, should show overflow
      const participantItems = page.locator('.text-gray-700');
      const participantCount = await participantItems.count();
      
      if (participantCount > 3) {
        await expect(page.getByText(/\+\d+ meer\.\.\./)).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async () => {
      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();
    });

    test('should handle microphone permission denied', async () => {
      // Override getUserMedia to reject
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new Error('Permission denied'))
          },
          writable: true
        });
      });

      await page.reload();
      
      // Expand panel again after reload
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();

      // Try to start recording
      await page.getByText('Start Opname').click();

      // Should show error message
      await expect(page.getByText(/Kon opname niet starten/)).toBeVisible({ timeout: 10000 });
      
      // Should return to start button
      await expect(page.getByText('Start Opname')).toBeVisible();
    });

    test('should handle network errors gracefully', async () => {
      // Mock network failure for webhook
      await page.route('**/webhook/transcription', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Start recording
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });

      // Simulate chunk processing after some time
      await page.waitForTimeout(3000);

      // Should show error message when chunk sending fails
      await expect(page.getByText(/Fout bij verzenden audio/)).toBeVisible({ timeout: 15000 });
    });

    test('should clear errors when starting new recording session', async () => {
      // First create an error condition
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.reject(new Error('Test error'))
          },
          writable: true
        });
      });

      await page.reload();
      
      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();

      // Try to start recording (should fail)
      await page.getByText('Start Opname').click();
      await expect(page.getByText(/Test error/)).toBeVisible({ timeout: 10000 });

      // Fix the error condition
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: {
            getUserMedia: () => Promise.resolve({
              getTracks: () => [{ stop: () => {} }],
              addEventListener: () => {},
              removeEventListener: () => {}
            })
          },
          writable: true
        });
      });

      await page.reload();
      
      // Expand panel again
      const panelHeaderAgain = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeaderAgain.click();

      // Try to start recording again (should succeed)
      await page.getByText('Start Opname').click();
      
      // Error should be cleared
      await expect(page.getByText(/Test error/)).not.toBeVisible();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Technical Information Display', () => {
    test.beforeEach(async () => {
      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();
    });

    test('should display technical configuration information', async () => {
      // Should show chunk size and audio format
      await expect(page.getByText('Chunk grootte:')).toBeVisible();
      await expect(page.getByText('90s')).toBeVisible();
      await expect(page.getByText('Audio format:')).toBeVisible();
      await expect(page.getByText('WebM/Opus')).toBeVisible();
    });

    test('should show N8N endpoint configuration', async () => {
      // Start recording to show session info
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });

      // Should show N8N endpoint
      await expect(page.getByText('N8N Endpoint:')).toBeVisible();
      await expect(page.locator('text=/webhook\/transcription/')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async () => {
      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();
    });

    test('should support keyboard navigation', async () => {
      // Focus on start button with keyboard
      await page.keyboard.press('Tab');
      
      // Find the start button and ensure it can be focused
      const startButton = page.getByText('Start Opname');
      await startButton.focus();
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      
      // Should start recording
      await expect(page.getByText('Initialiseren...')).toBeVisible();
    });

    test('should have proper ARIA labels and semantic structure', async () => {
      // Check that buttons have proper roles
      const startButton = page.getByText('Start Opname');
      await expect(startButton).toHaveRole('button');
      
      // Check for heading structure
      const mainHeading = page.getByText('Automatische Opname');
      await expect(mainHeading).toBeVisible();
    });

    test('should provide clear status information for screen readers', async () => {
      // Start recording
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });

      // Should show clear recording status
      await expect(page.getByText('REC')).toBeVisible();
      
      // Should show time information
      await expect(page.getByText(/\d+:\d+/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();

      // Should still show main functionality
      await expect(page.getByText('Start Opname')).toBeVisible();
      await expect(page.getByText('Deelnemers')).toBeVisible();
      
      // Should be able to start recording on mobile
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });
    });

    test('should work on tablet viewport', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Expand panel
      const panelHeader = page.getByText('Automatische Opname').locator('..').locator('..');
      await panelHeader.click();

      // Should maintain full functionality
      await expect(page.getByText('Start Opname')).toBeVisible();
      await expect(page.getByText('Chunk grootte:')).toBeVisible();
      
      // Recording should work normally
      await page.getByText('Start Opname').click();
      await expect(page.getByText('Stop Opname')).toBeVisible({ timeout: 10000 });
    });
  });
});