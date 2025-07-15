import { test, expect } from '@playwright/test';

test.describe('ConversationHub Recording Flow', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // Navigate to application
    await page.goto('/');
  });

  test('should display audio recorder component', async ({ page }) => {
    // Check if audio recorder is visible
    await expect(page.getByText('Audio Opname')).toBeVisible();
    await expect(page.getByRole('button', { name: /start opname/i })).toBeVisible();
  });

  test('should show initial recording state', async ({ page }) => {
    // Verify initial state text
    await expect(page.getByText('Druk op "Start Opname" om te beginnen')).toBeVisible();
    
    // Check that start button is enabled
    const startButton = page.getByRole('button', { name: /start opname/i });
    await expect(startButton).toBeEnabled();
    await expect(startButton).not.toHaveClass(/disabled/);
  });

  test('should start recording when start button is clicked', async ({ page }) => {
    // Mock getUserMedia to avoid actual microphone access in CI
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async () => {
        const stream = new MediaStream();
        // Add a mock audio track
        const track = {
          kind: 'audio',
          stop: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
        };
        // @ts-ignore
        stream.addTrack(track);
        return stream;
      };
      
      // Mock MediaRecorder
      // @ts-ignore
      window.MediaRecorder = class {
        constructor() {
          this.state = 'inactive';
        }
        start() {
          this.state = 'recording';
          // Simulate recording state change
          setTimeout(() => {
            if (this.ondataavailable) {
              const blob = new Blob(['fake audio data'], { type: 'audio/webm' });
              this.ondataavailable({ data: blob });
            }
          }, 100);
        }
        stop() {
          this.state = 'inactive';
        }
        addEventListener() {}
        removeEventListener() {}
      };
      
      // @ts-ignore
      MediaRecorder.isTypeSupported = () => true;
    });

    // Click start recording button
    await page.getByRole('button', { name: /start opname/i }).click();
    
    // Wait for recording state to change
    await expect(page.getByText('Opname actief - spreek duidelijk in de microfoon')).toBeVisible();
    
    // Check for recording indicator
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Check that button text changed
    await expect(page.getByRole('button', { name: /stop opname/i })).toBeVisible();
  });

  test('should show duration timer when recording', async ({ page }) => {
    // Setup mocks (same as previous test)
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async () => new MediaStream();
      // @ts-ignore
      window.MediaRecorder = class {
        constructor() { this.state = 'inactive'; }
        start() { this.state = 'recording'; }
        stop() { this.state = 'inactive'; }
        addEventListener() {}
        removeEventListener() {}
      };
      // @ts-ignore
      MediaRecorder.isTypeSupported = () => true;
    });

    // Start recording
    await page.getByRole('button', { name: /start opname/i }).click();
    
    // Check for duration display (should start at 00:00)
    await expect(page.getByText('00:00')).toBeVisible();
  });

  test('should stop recording when stop button is clicked', async ({ page }) => {
    // Setup mocks
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async () => new MediaStream();
      // @ts-ignore
      window.MediaRecorder = class {
        constructor() { this.state = 'inactive'; }
        start() { this.state = 'recording'; }
        stop() { this.state = 'inactive'; }
        addEventListener() {}
        removeEventListener() {}
      };
      // @ts-ignore
      MediaRecorder.isTypeSupported = () => true;
    });

    // Start recording
    await page.getByRole('button', { name: /start opname/i }).click();
    
    // Wait for recording state
    await expect(page.getByRole('button', { name: /stop opname/i })).toBeVisible();
    
    // Stop recording
    await page.getByRole('button', { name: /stop opname/i }).click();
    
    // Should return to initial state
    await expect(page.getByRole('button', { name: /start opname/i })).toBeVisible();
    await expect(page.getByText('Druk op "Start Opname" om te beginnen')).toBeVisible();
  });

  test('should handle microphone permission denied', async ({ page, context }) => {
    // Remove microphone permission
    await context.clearPermissions();
    
    // Mock getUserMedia to reject
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('Permission denied');
      };
    });

    // Try to start recording
    await page.getByRole('button', { name: /start opname/i }).click();
    
    // Should show error message
    await expect(page.getByText(/Kan microfoon niet openen/i)).toBeVisible();
    
    // Should remain in idle state
    await expect(page.getByRole('button', { name: /start opname/i })).toBeVisible();
  });

  test('should show processing state when initializing', async ({ page }) => {
    // Mock slow getUserMedia
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve(new MediaStream()), 1000);
        });
      };
      // @ts-ignore
      window.MediaRecorder = class {
        constructor() { this.state = 'inactive'; }
        start() { this.state = 'recording'; }
        stop() { this.state = 'inactive'; }
        addEventListener() {}
        removeEventListener() {}
      };
      // @ts-ignore
      MediaRecorder.isTypeSupported = () => true;
    });

    // Click start - should show processing state
    await page.getByRole('button', { name: /start opname/i }).click();
    
    // Should show processing text temporarily
    await expect(page.getByText('Microfoon wordt voorbereid...')).toBeVisible();
    await expect(page.getByRole('button', { name: /bezig/i })).toBeVisible();
  });

  test('complete recording workflow', async ({ page }) => {
    // Full workflow test
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = async () => new MediaStream();
      // @ts-ignore
      window.MediaRecorder = class {
        constructor() { this.state = 'inactive'; }
        start() { 
          this.state = 'recording';
          // Simulate audio chunks
          setTimeout(() => {
            if (this.ondataavailable) {
              const blob = new Blob(['audio'], { type: 'audio/webm' });
              this.ondataavailable({ data: blob });
            }
          }, 500);
        }
        stop() { this.state = 'inactive'; }
        addEventListener() {}
        removeEventListener() {}
      };
      // @ts-ignore
      MediaRecorder.isTypeSupported = () => true;
    });

    // 1. Initial state
    await expect(page.getByText('Audio Opname')).toBeVisible();
    
    // 2. Start recording
    await page.getByRole('button', { name: /start opname/i }).click();
    
    // 3. Recording active
    await expect(page.getByText('Opname actief - spreek duidelijk in de microfoon')).toBeVisible();
    
    // 4. Wait a moment for duration timer
    await page.waitForTimeout(1500);
    
    // 5. Stop recording
    await page.getByRole('button', { name: /stop opname/i }).click();
    
    // 6. Back to initial state
    await expect(page.getByText('Druk op "Start Opname" om te beginnen')).toBeVisible();
  });
});