/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import MeetingTypes from '../MeetingTypes';
import meetingTypeService from '../../../services/api/meetingTypeService';

// Mock the meeting type service
jest.mock('../../../services/api/meetingTypeService');
const mockMeetingTypeService = meetingTypeService as jest.Mocked<typeof meetingTypeService>;

// Mock data
const mockMeetingTypes = [
  {
    id: 1,
    name: 'participatie_intake',
    display_name: 'Participatie Intake',
    description: 'Intake gesprek voor participatie in de gemeente',
    auto_anonymize: true,
    auto_generate_report: true,
    estimated_duration_minutes: 60,
    is_active: true,
    privacy_filters: {
      medical_terms: ['diagnose', 'medicatie'],
      personal_data: ['bsn', 'sofinummer'],
      sensitive_topics: ['schulden']
    },
    participant_filters: {
      exclude_from_report: ['huisarts'],
      anonymize_roles: ['casemanager']
    },
    default_agenda_items: [
      { title: 'Welkomst en kennismaking', estimated_duration: 5 },
      { title: 'Huidige situatie bespreken', estimated_duration: 15 }
    ],
    allowed_participant_roles: ['client', 'casemanager'],
    privacy_levels_by_role: {
      client: 'full_privacy',
      casemanager: 'professional_context'
    },
    report_template: {
      sections: {
        samenvatting: 'Korte samenvatting van het gesprek'
      },
      tone: 'professional_caring',
      exclude_personal_details: true
    },
    metadata: {
      department: 'participatie',
      avg_compliance_level: 'high'
    }
  },
  {
    id: 2,
    name: 'algemeen_overleg',
    display_name: 'Algemeen Overleg',
    description: 'Standaard overleg tussen professionals',
    auto_anonymize: false,
    auto_generate_report: true,
    estimated_duration_minutes: 60,
    is_active: true,
    privacy_filters: {
      medical_terms: [],
      personal_data: ['bsn'],
      sensitive_topics: []
    },
    participant_filters: {
      exclude_from_report: [],
      anonymize_roles: []
    },
    default_agenda_items: [
      { title: 'Opening en mededelingen', estimated_duration: 5 }
    ],
    allowed_participant_roles: ['teamleider', 'medewerker'],
    privacy_levels_by_role: {
      teamleider: 'standard',
      medewerker: 'standard'
    },
    report_template: {
      sections: {
        aanwezigen: 'Lijst van aanwezigen'
      },
      tone: 'professional_neutral',
      exclude_personal_details: false
    },
    metadata: {
      department: 'algemeen',
      avg_compliance_level: 'medium'
    }
  }
];

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn()
});

describe('MeetingTypes Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeetingTypeService.getAllMeetingTypes.mockResolvedValue(mockMeetingTypes);
  });

  describe('Initial Rendering', () => {
    test('renders loading state initially', () => {
      mockMeetingTypeService.getAllMeetingTypes.mockReturnValue(
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<MeetingTypes />);
      
      expect(screen.getByText('Meeting types laden...')).toBeInTheDocument();
      expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
    });

    test('renders header and create button', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByText('🎯 Meeting Types Configuratie')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Beheer de verschillende soorten gesprekken en hun instellingen')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /nieuw meeting type/i })).toBeInTheDocument();
    });

    test('loads and displays meeting types', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByText('Participatie Intake')).toBeInTheDocument();
        expect(screen.getByText('Algemeen Overleg')).toBeInTheDocument();
      });

      expect(mockMeetingTypeService.getAllMeetingTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Meeting Type Cards', () => {
    test('displays meeting type information correctly', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByText('Participatie Intake')).toBeInTheDocument();
      });

      // Check if basic info is displayed
      expect(screen.getByText('participatie_intake')).toBeInTheDocument();
      expect(screen.getByText('Intake gesprek voor participatie in de gemeente')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
      
      // Check status indicators
      expect(screen.getAllByText('Actief')).toHaveLength(2);
      expect(screen.getAllByText('✅ Ja')).toHaveLength(3); // auto_anonymize and auto_generate_report
      expect(screen.getAllByText('❌ Nee')).toHaveLength(1); // algemeen_overleg auto_anonymize
    });

    test('shows correct agenda item count', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByText('2 items')).toBeInTheDocument(); // participatie_intake has 2 agenda items
        expect(screen.getByText('1 items')).toBeInTheDocument(); // algemeen_overleg has 1 agenda item
      });
    });

    test('renders action buttons for each meeting type', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getAllByText('✏️ Bewerken')).toHaveLength(2);
        expect(screen.getAllByText('🧪 Test Privacy')).toHaveLength(2);
        expect(screen.getAllByText('🗑️')).toHaveLength(2);
      });
    });
  });

  describe('Create New Meeting Type', () => {
    test('opens create modal when create button is clicked', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nieuw meeting type/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      
      expect(screen.getByText('➕ Nieuw Meeting Type')).toBeInTheDocument();
      expect(screen.getByText('📋 Basis Informatie')).toBeInTheDocument();
    });

    test('shows empty form fields in create modal', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      expect(screen.getByPlaceholderText('bijv: wmo_keukentafel')).toHaveValue('');
      expect(screen.getByPlaceholderText('bijv: WMO Keukentafelgesprek')).toHaveValue('');
      expect(screen.getByPlaceholderText('Beschrijf waar dit meeting type voor wordt gebruikt...')).toHaveValue('');
    });

    test('can add and remove privacy filter terms', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      // Add medical term
      const addMedicalTermButton = screen.getByText('➕ Medische term toevoegen');
      fireEvent.click(addMedicalTermButton);
      
      const medicalTermInput = screen.getByPlaceholderText('bijv: diagnose, medicatie');
      expect(medicalTermInput).toBeInTheDocument();
      
      fireEvent.change(medicalTermInput, { target: { value: 'diabetes' } });
      expect(medicalTermInput).toHaveValue('diabetes');

      // Remove the term
      const removeButton = screen.getByText('🗑️');
      fireEvent.click(removeButton);
      
      expect(screen.queryByDisplayValue('diabetes')).not.toBeInTheDocument();
    });

    test('can add and modify agenda items', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      // Add agenda item
      const addAgendaButton = screen.getByText('➕ Agendapunt toevoegen');
      fireEvent.click(addAgendaButton);
      
      const agendaTitleInput = screen.getByPlaceholderText('Agendapunt titel');
      expect(agendaTitleInput).toBeInTheDocument();
      
      fireEvent.change(agendaTitleInput, { target: { value: 'Opening' } });
      expect(agendaTitleInput).toHaveValue('Opening');
    });
  });

  describe('Edit Meeting Type', () => {
    test('opens edit modal with pre-filled data when edit button is clicked', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getAllByText('✏️ Bewerken')).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByText('✏️ Bewerken')[0]);
      
      expect(screen.getByText('✏️ Meeting Type Bewerken')).toBeInTheDocument();
      expect(screen.getByDisplayValue('participatie_intake')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Participatie Intake')).toBeInTheDocument();
    });

    test('pre-fills privacy filters in edit mode', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getAllByText('✏️ Bewerken')[0]);
      });

      // Check if existing privacy filters are loaded
      expect(screen.getByDisplayValue('diagnose')).toBeInTheDocument();
      expect(screen.getByDisplayValue('medicatie')).toBeInTheDocument();
    });

    test('pre-fills agenda items in edit mode', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getAllByText('✏️ Bewerken')[0]);
      });

      // Check if existing agenda items are loaded
      expect(screen.getByDisplayValue('Welkomst en kennismaking')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Huidige situatie bespreken')).toBeInTheDocument();
    });
  });

  describe('Privacy Testing', () => {
    test('opens privacy test modal when test button is clicked', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getAllByText('🧪 Test Privacy')).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByText('🧪 Test Privacy')[0]);
      
      expect(screen.getByText('🧪 Privacy Filter Test - Participatie Intake')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Voer hier een testtekst in om te zien of privacy filters worden toegepast...')).toBeInTheDocument();
    });

    test('can run privacy filter test', async () => {
      mockMeetingTypeService.testPrivacyFilters.mockResolvedValue({
        text: 'Patient heeft diabetes',
        should_filter: true,
        filters_applied: mockMeetingTypes[0].privacy_filters
      });

      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getAllByText('🧪 Test Privacy')[0]);
      });

      const testTextArea = screen.getByPlaceholderText('Voer hier een testtekst in om te zien of privacy filters worden toegepast...');
      fireEvent.change(testTextArea, { target: { value: 'Patient heeft diabetes' } });

      const testButton = screen.getByRole('button', { name: /privacy filter testen/i });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockMeetingTypeService.testPrivacyFilters).toHaveBeenCalledWith(1, 'Patient heeft diabetes');
      });
    });
  });

  describe('Delete Meeting Type', () => {
    test('shows confirmation dialog when delete button is clicked', async () => {
      const mockConfirm = jest.mocked(window.confirm);
      mockConfirm.mockReturnValue(true);
      mockMeetingTypeService.deleteMeetingType.mockResolvedValue(true);

      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getAllByText('🗑️')).toHaveLength(2);
      });

      fireEvent.click(screen.getAllByText('🗑️')[0]);
      
      expect(mockConfirm).toHaveBeenCalledWith('Weet je zeker dat je dit meeting type wilt deactiveren?');
      expect(mockMeetingTypeService.deleteMeetingType).toHaveBeenCalledWith(1);
    });

    test('does not delete when user cancels confirmation', async () => {
      const mockConfirm = jest.mocked(window.confirm);
      mockConfirm.mockReturnValue(false);

      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getAllByText('🗑️')[0]);
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockMeetingTypeService.deleteMeetingType).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation and Saving', () => {
    test('can save new meeting type with valid data', async () => {
      mockMeetingTypeService.createMeetingType.mockResolvedValue({
        ...mockMeetingTypes[0],
        id: 3
      });

      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('bijv: wmo_keukentafel'), { 
        target: { value: 'test_meeting' } 
      });
      fireEvent.change(screen.getByPlaceholderText('bijv: WMO Keukentafelgesprek'), { 
        target: { value: 'Test Meeting' } 
      });

      const saveButton = screen.getByRole('button', { name: /aanmaken/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockMeetingTypeService.createMeetingType).toHaveBeenCalled();
      });
    });

    test('can update existing meeting type', async () => {
      mockMeetingTypeService.updateMeetingType.mockResolvedValue(mockMeetingTypes[0]);

      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getAllByText('✏️ Bewerken')[0]);
      });

      const updateButton = screen.getByRole('button', { name: /bijwerken/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockMeetingTypeService.updateMeetingType).toHaveBeenCalledWith(1, expect.any(Object));
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when loading fails', async () => {
      mockMeetingTypeService.getAllMeetingTypes.mockRejectedValue(new Error('Network error'));

      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByText(/fout bij laden meeting types/i)).toBeInTheDocument();
      });
    });

    test('displays error message when saving fails', async () => {
      mockMeetingTypeService.createMeetingType.mockRejectedValue(new Error('Validation error'));

      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      const saveButton = screen.getByRole('button', { name: /aanmaken/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/fout bij opslaan/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    test('can close modal with close button', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('➕ Nieuw Meeting Type')).not.toBeInTheDocument();
    });

    test('can close modal with cancel button', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      const cancelButton = screen.getByRole('button', { name: /annuleren/i });
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('➕ Nieuw Meeting Type')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('displays empty state when no meeting types exist', async () => {
      mockMeetingTypeService.getAllMeetingTypes.mockResolvedValue([]);

      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByText('Nog geen meeting types')).toBeInTheDocument();
        expect(screen.getByText('Maak je eerste meeting type aan om te beginnen')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /eerste meeting type aanmaken/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nieuw meeting type/i })).toBeInTheDocument();
      });

      // Check for proper button roles
      expect(screen.getAllByRole('button')).toHaveLength(7); // Create + 2x(Edit, Test, Delete)
    });

    test('form fields have proper labels', async () => {
      render(<MeetingTypes />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /nieuw meeting type/i }));
      });

      expect(screen.getByLabelText(/systeemnaam/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/weergavenaam/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/beschrijving/i)).toBeInTheDocument();
    });
  });
});