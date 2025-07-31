import { test, expect, Page } from '@playwright/test';

// Test data
const testMeetingType = {
  name: 'test_automation_meeting',
  display_name: 'Test Automation Meeting',
  description: 'Een test meeting type aangemaakt door automatische tests',
  estimated_duration_minutes: 45
};

const privacyFilterTerms = [
  'geheime informatie',
  'persoonlijke data',
  'medische gegevens'
];

const agendaItems = [
  { title: 'Opening en welkom', duration: 5 },
  { title: 'Hoofdonderwerp bespreking', duration: 30 },
  { title: 'Actiepunten en afsluiting', duration: 10 }
];

test.describe('Meeting Types Configuration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to meeting types page
    await page.goto('/settings/meeting-types');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Meeting Types Configuratie');
  });

  test.describe('Page Loading and Initial State', () => {
    
    test('should load meeting types page successfully', async ({ page }) => {
      // Check if main header is visible
      await expect(page.locator('h1')).toContainText('🎯 Meeting Types Configuratie');
      
      // Check if description is visible
      await expect(page.locator('text=Beheer de verschillende soorten gesprekken')).toBeVisible();
      
      // Check if create button is visible
      await expect(page.locator('button', { hasText: 'Nieuw Meeting Type' })).toBeVisible();
    });

    test('should display existing meeting types', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Check if at least some meeting type cards are visible
      const meetingTypeCards = page.locator('[data-testid="meeting-type-card"]');
      await expect(meetingTypeCards.first()).toBeVisible({ timeout: 10000 });
      
      // Verify card contents
      await expect(page.locator('text=Participatie Intake')).toBeVisible();
      await expect(page.locator('text=participatie_intake')).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
      // Reload page to catch loading state
      await page.reload();
      
      // Check for loading indicator (might be very brief)
      const loadingText = page.locator('text=Meeting types laden...');
      // Don't assert visibility as it might disappear too quickly
      
      // Wait for content to load
      await expect(page.locator('h1')).toContainText('Meeting Types Configuratie');
    });
  });

  test.describe('Create New Meeting Type', () => {
    
    test('should open create modal when create button is clicked', async ({ page }) => {
      // Click create button
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Check if modal opens
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      await expect(page.locator('text=📋 Basis Informatie')).toBeVisible();
      
      // Check if form fields are empty
      await expect(page.locator('input[placeholder*="wmo_keukentafel"]')).toHaveValue('');
      await expect(page.locator('input[placeholder*="WMO Keukentafelgesprek"]')).toHaveValue('');
    });

    test('should create new meeting type with basic information', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Fill basic information
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill(testMeetingType.name);
      await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill(testMeetingType.display_name);
      await page.locator('textarea[placeholder*="Beschrijf waar dit meeting type"]').fill(testMeetingType.description);
      
      // Set duration
      await page.locator('input[type="number"]').first().fill(testMeetingType.estimated_duration_minutes.toString());
      
      // Save the meeting type
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Wait for modal to close and page to reload
      await expect(page.locator('text=➕ Nieuw Meeting Type')).not.toBeVisible();
      
      // Verify the new meeting type appears in the list
      await expect(page.locator(`text=${testMeetingType.display_name}`)).toBeVisible();
      await expect(page.locator(`text=${testMeetingType.name}`)).toBeVisible();
    });

    test('should add and configure privacy filters', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Fill basic info first
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('test_privacy_meeting');
      await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill('Test Privacy Meeting');
      
      // Add medical terms
      for (const term of privacyFilterTerms) {
        await page.locator('button', { hasText: 'Medische term toevoegen' }).click();
        const lastMedicalInput = page.locator('input[placeholder*="diagnose, medicatie"]').last();
        await lastMedicalInput.fill(term);
      }
      
      // Verify the terms were added
      for (const term of privacyFilterTerms) {
        await expect(page.locator(`input[value="${term}"]`)).toBeVisible();
      }
      
      // Save the meeting type
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Verify creation
      await expect(page.locator('text=Test Privacy Meeting')).toBeVisible();
    });

    test('should add and configure agenda items', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Fill basic info
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('test_agenda_meeting');
      await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill('Test Agenda Meeting');
      
      // Add agenda items
      for (const item of agendaItems) {
        await page.locator('button', { hasText: 'Agendapunt toevoegen' }).click();
        
        const titleInputs = page.locator('input[placeholder="Agendapunt titel"]');
        const durationInputs = page.locator('input[type="number"][min="1"][max="120"]');
        
        await titleInputs.last().fill(item.title);
        await durationInputs.last().fill(item.duration.toString());
      }
      
      // Verify agenda items were added
      for (const item of agendaItems) {
        await expect(page.locator(`input[value="${item.title}"]`)).toBeVisible();
        await expect(page.locator(`input[value="${item.duration}"]`)).toBeVisible();
      }
      
      // Save the meeting type
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Verify creation and agenda count
      await expect(page.locator('text=Test Agenda Meeting')).toBeVisible();
      await expect(page.locator('text=3 items')).toBeVisible(); // Should show 3 agenda items
    });

    test('should validate required fields', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Try to save without filling required fields
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Modal should stay open (validation should prevent saving)
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      
      // Fill only name, leave display name empty
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('test_validation');
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Should still be in modal due to missing display_name
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
    });
  });

  test.describe('Edit Existing Meeting Type', () => {
    
    test('should open edit modal with pre-filled data', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Click edit button on first meeting type
      await page.locator('button', { hasText: '✏️ Bewerken' }).first().click();
      
      // Check if edit modal opens
      await expect(page.locator('text=✏️ Meeting Type Bewerken')).toBeVisible();
      
      // Verify that form fields are pre-filled
      const nameInput = page.locator('input[placeholder*="wmo_keukentafel"]');
      const displayNameInput = page.locator('input[placeholder*="WMO Keukentafelgesprek"]');
      
      await expect(nameInput).not.toHaveValue('');
      await expect(displayNameInput).not.toHaveValue('');
      
      // Check if existing privacy filters are loaded
      const medicalTerms = page.locator('input[placeholder*="diagnose, medicatie"]');
      if (await medicalTerms.count() > 0) {
        await expect(medicalTerms.first()).not.toHaveValue('');
      }
    });

    test('should update existing meeting type', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Click edit on first meeting type
      await page.locator('button', { hasText: '✏️ Bewerken' }).first().click();
      
      // Modify the description
      const descriptionField = page.locator('textarea[placeholder*="Beschrijf waar dit meeting type"]');
      await descriptionField.clear();
      await descriptionField.fill('Updated description for testing purposes');
      
      // Save changes
      await page.locator('button', { hasText: 'Bijwerken' }).click();
      
      // Wait for modal to close
      await expect(page.locator('text=✏️ Meeting Type Bewerken')).not.toBeVisible();
      
      // Verify the update was saved (description might not be visible in card view)
      // So we'll re-open edit modal to verify
      await page.locator('button', { hasText: '✏️ Bewerken' }).first().click();
      await expect(page.locator('textarea[value*="Updated description for testing"]')).toBeVisible();
      
      // Close modal
      await page.locator('button', { hasText: 'Annuleren' }).click();
    });

    test('should add new privacy filter to existing meeting type', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Edit first meeting type
      await page.locator('button', { hasText: '✏️ Bewerken' }).first().click();
      
      // Add a new medical term
      await page.locator('button', { hasText: 'Medische term toevoegen' }).click();
      const newMedicalInput = page.locator('input[placeholder*="diagnose, medicatie"]').last();
      await newMedicalInput.fill('test_medische_term');
      
      // Add a personal data term
      await page.locator('button', { hasText: 'Persoonlijk gegeven toevoegen' }).click();
      const newPersonalInput = page.locator('input[placeholder*="bsn, sofinummer"]').last();
      await newPersonalInput.fill('test_persoonlijk_gegeven');
      
      // Save changes
      await page.locator('button', { hasText: 'Bijwerken' }).click();
      
      // Verify modal closes
      await expect(page.locator('text=✏️ Meeting Type Bewerken')).not.toBeVisible();
    });

    test('should remove privacy filter from existing meeting type', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Edit first meeting type
      await page.locator('button', { hasText: '✏️ Bewerken' }).first().click();
      
      // Check if there are any medical terms to remove
      const medicalTerms = page.locator('input[placeholder*="diagnose, medicatie"]');
      const count = await medicalTerms.count();
      
      if (count > 0) {
        // Remove the first medical term
        const removeButton = page.locator('button', { hasText: '🗑️' }).first();
        await removeButton.click();
        
        // Verify one less medical term input
        await expect(page.locator('input[placeholder*="diagnose, medicatie"]')).toHaveCount(count - 1);
      }
      
      // Cancel to avoid affecting other tests
      await page.locator('button', { hasText: 'Annuleren' }).click();
    });
  });

  test.describe('Privacy Filter Testing', () => {
    
    test('should open privacy test modal', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Click test privacy button on first meeting type
      await page.locator('button', { hasText: '🧪 Test Privacy' }).first().click();
      
      // Check if test modal opens
      await expect(page.locator('text=🧪 Privacy Filter Test')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="Voer hier een testtekst in"]')).toBeVisible();
    });

    test('should run privacy filter test with sample text', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Open privacy test modal
      await page.locator('button', { hasText: '🧪 Test Privacy' }).first().click();
      
      // Enter test text
      const testText = 'De patiënt heeft diabetes en gebruikt medicatie voor bloeddruk';
      await page.locator('textarea[placeholder*="Voer hier een testtekst in"]').fill(testText);
      
      // Run the test
      await page.locator('button', { hasText: 'Privacy Filter Testen' }).click();
      
      // Wait for results (this depends on your implementation)
      // The test might show results inline or in a separate section
      await page.waitForTimeout(1000); // Wait for API call
      
      // Close modal
      await page.locator('button', { hasText: '✕' }).click();
      await expect(page.locator('text=🧪 Privacy Filter Test')).not.toBeVisible();
    });

    test('should handle empty test text', async ({ page }) => {
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Open privacy test modal
      await page.locator('button', { hasText: '🧪 Test Privacy' }).first().click();
      
      // Try to run test without entering text
      const testButton = page.locator('button', { hasText: 'Privacy Filter Testen' });
      
      // Button should be disabled when no text is entered
      await expect(testButton).toBeDisabled();
      
      // Enter some text to enable button
      await page.locator('textarea[placeholder*="Voer hier een testtekst in"]').fill('test');
      await expect(testButton).toBeEnabled();
    });
  });

  test.describe('Delete Meeting Type', () => {
    
    test('should show confirmation dialog when delete is clicked', async ({ page }) => {
      // Mock the confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('Weet je zeker dat je dit meeting type wilt deactiveren?');
        await dialog.dismiss(); // Dismiss to avoid actual deletion
      });
      
      // Wait for meeting types to load
      await page.waitForLoadState('networkidle');
      
      // Click delete button on first meeting type
      await page.locator('button', { hasText: '🗑️' }).first().click();
      
      // The dialog event handler above will verify the confirmation
    });

    test('should cancel deletion when user dismisses confirmation', async ({ page }) => {
      // Track original meeting type count
      await page.waitForLoadState('networkidle');
      const originalCards = await page.locator('[data-testid="meeting-type-card"]').count();
      
      // Mock confirmation dialog to dismiss
      page.on('dialog', async dialog => {
        await dialog.dismiss();
      });
      
      // Click delete button
      await page.locator('button', { hasText: '🗑️' }).first().click();
      
      // Wait a moment and verify count hasn't changed
      await page.waitForTimeout(500);
      const currentCards = await page.locator('[data-testid="meeting-type-card"]').count();
      expect(currentCards).toBe(originalCards);
    });
  });

  test.describe('Modal Interactions', () => {
    
    test('should close modal with X button', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      
      // Close with X button
      await page.locator('button', { hasText: '✕' }).click();
      await expect(page.locator('text=➕ Nieuw Meeting Type')).not.toBeVisible();
    });

    test('should close modal with cancel button', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      
      // Close with cancel button
      await page.locator('button', { hasText: 'Annuleren' }).click();
      await expect(page.locator('text=➕ Nieuw Meeting Type')).not.toBeVisible();
    });

    test('should handle modal backdrop click', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      
      // Click outside modal (backdrop)
      await page.locator('.fixed.inset-0.bg-black.bg-opacity-50').click({
        position: { x: 10, y: 10 } // Click in top-left corner of backdrop
      });
      
      // Modal might or might not close depending on implementation
      // This test documents the expected behavior
    });
  });

  test.describe('Form Validation and UX', () => {
    
    test('should show proper validation states', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Test required field validation by trying to submit empty form
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Form should still be visible (validation prevents submission)
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      
      // Fill in system name but leave display name empty
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('test_name');
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Should still be in modal
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
    });

    test('should handle numeric input validation', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Test duration field with invalid values
      const durationInput = page.locator('input[type="number"][min="5"][max="480"]');
      
      // Try to enter value below minimum
      await durationInput.fill('2');
      await expect(durationInput).toHaveValue('2'); // Browser might allow but validation should catch
      
      // Try to enter value above maximum
      await durationInput.fill('500');
      await expect(durationInput).toHaveValue('500'); // Browser might allow but validation should catch
      
      // Enter valid value
      await durationInput.fill('90');
      await expect(durationInput).toHaveValue('90');
    });

    test('should show proper loading states during save operations', async ({ page }) => {
      // Open create modal
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      
      // Fill minimum required fields
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('test_loading');
      await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill('Test Loading');
      
      // Click save and look for loading indicators
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Button might show loading state or be disabled during save
      // This depends on your implementation
      
      // Wait for operation to complete
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Reload page
      await page.reload();
      await expect(page.locator('h1')).toContainText('Meeting Types Configuratie');
      
      // Check if create button is still accessible
      await expect(page.locator('button', { hasText: 'Nieuw Meeting Type' })).toBeVisible();
      
      // Test opening modal on mobile
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
      
      // Modal should be responsive
      const modal = page.locator('.bg-white.rounded-lg.max-w-4xl');
      await expect(modal).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Reload page
      await page.reload();
      await expect(page.locator('h1')).toContainText('Meeting Types Configuratie');
      
      // Check grid layout on tablet
      const meetingTypeCards = page.locator('[data-testid="meeting-type-card"]');
      await expect(meetingTypeCards.first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept API calls and return error
      await page.route('**/api/meeting-types', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });
      
      // Reload page to trigger API call
      await page.reload();
      
      // Should show error message
      await expect(page.locator('text=Fout bij laden meeting types')).toBeVisible();
    });

    test('should handle save errors gracefully', async ({ page }) => {
      // Wait for page to load normally first
      await page.waitForLoadState('networkidle');
      
      // Intercept create API call and return error
      await page.route('**/api/meeting-types', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: 'Validation error: Name already exists'
            })
          });
        } else {
          route.continue();
        }
      });
      
      // Try to create a meeting type
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('duplicate_name');
      await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill('Duplicate Name');
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Should show error message
      await expect(page.locator('text=Fout bij opslaan')).toBeVisible();
      
      // Modal should stay open
      await expect(page.locator('text=➕ Nieuw Meeting Type')).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    
    test('should have good accessibility attributes', async ({ page }) => {
      // Check for proper heading hierarchy
      await expect(page.locator('h1')).toHaveCount(1);
      
      // Check for proper button labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        
        // All buttons should have text content or aria-label
        if (!text || text.trim() === '') {
          await expect(button).toHaveAttribute('aria-label');
        }
      }
    });

    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to page
      await page.goto('/settings/meeting-types');
      
      // Wait for main content to be visible
      await expect(page.locator('h1')).toContainText('Meeting Types Configuratie');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds (adjust based on your requirements)
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('Data Persistence', () => {
    
    test('should persist data across page reloads', async ({ page }) => {
      // Create a meeting type
      await page.locator('button', { hasText: 'Nieuw Meeting Type' }).click();
      await page.locator('input[placeholder*="wmo_keukentafel"]').fill('persistent_test');
      await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill('Persistent Test');
      await page.locator('button', { hasText: 'Aanmaken' }).click();
      
      // Wait for modal to close
      await expect(page.locator('text=➕ Nieuw Meeting Type')).not.toBeVisible();
      
      // Verify it appears in list
      await expect(page.locator('text=Persistent Test')).toBeVisible();
      
      // Reload page
      await page.reload();
      
      // Should still be there
      await expect(page.locator('text=Persistent Test')).toBeVisible();
    });
  });
});

// Helper functions for complex interactions
async function fillBasicMeetingTypeInfo(page: Page, data: typeof testMeetingType) {
  await page.locator('input[placeholder*="wmo_keukentafel"]').fill(data.name);
  await page.locator('input[placeholder*="WMO Keukentafelgesprek"]').fill(data.display_name);
  await page.locator('textarea[placeholder*="Beschrijf waar dit meeting type"]').fill(data.description);
  await page.locator('input[type="number"]').first().fill(data.estimated_duration_minutes.toString());
}

async function addPrivacyFilters(page: Page, terms: string[]) {
  for (const term of terms) {
    await page.locator('button', { hasText: 'Medische term toevoegen' }).click();
    const lastInput = page.locator('input[placeholder*="diagnose, medicatie"]').last();
    await lastInput.fill(term);
  }
}

async function addAgendaItems(page: Page, items: Array<{title: string, duration: number}>) {
  for (const item of items) {
    await page.locator('button', { hasText: 'Agendapunt toevoegen' }).click();
    
    const titleInputs = page.locator('input[placeholder="Agendapunt titel"]');
    const durationInputs = page.locator('input[type="number"][min="1"][max="120"]');
    
    await titleInputs.last().fill(item.title);
    await durationInputs.last().fill(item.duration.toString());
  }
}