<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MeetingType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class MeetingTypeController extends Controller
{
    /**
     * Haal alle meeting types op
     */
    public function index(): JsonResponse
    {
        try {
            $meetingTypes = MeetingType::where('is_active', true)
                ->orderBy('display_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $meetingTypes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen meeting types: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Haal specifiek meeting type op
     */
    public function show($id): JsonResponse
    {
        try {
            $meetingType = MeetingType::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $meetingType
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Meeting type niet gevonden'
            ], 404);
        }
    }

    /**
     * Maak nieuw meeting type aan
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:meeting_types,name',
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'privacy_filters' => 'nullable|array',
                'participant_filters' => 'nullable|array',
                'auto_anonymize' => 'boolean',
                'default_agenda_items' => 'nullable|array',
                'allowed_participant_roles' => 'nullable|array',
                'privacy_levels_by_role' => 'nullable|array',
                'report_template' => 'nullable|array',
                'auto_generate_report' => 'boolean',
                'estimated_duration_minutes' => 'nullable|integer|min:1|max:1440',
                'is_active' => 'boolean',
                'metadata' => 'nullable|array'
            ]);

            $meetingType = MeetingType::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Meeting type succesvol aangemaakt',
                'data' => $meetingType
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij aanmaken meeting type: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Update meeting type
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $meetingType = MeetingType::findOrFail($id);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255', Rule::unique('meeting_types')->ignore($id)],
                'display_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'privacy_filters' => 'nullable|array',
                'participant_filters' => 'nullable|array',
                'auto_anonymize' => 'boolean',
                'default_agenda_items' => 'nullable|array',
                'allowed_participant_roles' => 'nullable|array',
                'privacy_levels_by_role' => 'nullable|array',
                'report_template' => 'nullable|array',
                'auto_generate_report' => 'boolean',
                'estimated_duration_minutes' => 'nullable|integer|min:1|max:1440',
                'is_active' => 'boolean',
                'metadata' => 'nullable|array'
            ]);

            $meetingType->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Meeting type succesvol bijgewerkt',
                'data' => $meetingType->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij bijwerken meeting type: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Deactiveer meeting type (zachte delete)
     */
    public function destroy($id): JsonResponse
    {
        try {
            $meetingType = MeetingType::findOrFail($id);
            
            // Check of er meetings aan gekoppeld zijn
            $meetingCount = $meetingType->meetings()->count();
            if ($meetingCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Kan meeting type niet verwijderen. Er zijn nog {$meetingCount} gesprekken aan gekoppeld."
                ], 400);
            }

            $meetingType->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Meeting type succesvol gedeactiveerd'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij deactiveren meeting type: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Haal default agenda items op voor meeting type
     */
    public function getDefaultAgenda($id): JsonResponse
    {
        try {
            $meetingType = MeetingType::findOrFail($id);
            $defaultItems = $meetingType->getDefaultAgendaItems();

            return response()->json([
                'success' => true,
                'data' => $defaultItems
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen standaard agenda'
            ], 404);
        }
    }

    /**
     * Test privacy filters
     */
    public function testPrivacyFilters(Request $request, $id): JsonResponse
    {
        try {
            $meetingType = MeetingType::findOrFail($id);
            $testText = $request->input('text', '');

            $shouldFilter = false;
            $filters = $meetingType->privacy_filters ?? [];

            foreach ($filters as $category => $terms) {
                if (is_array($terms)) {
                    foreach ($terms as $term) {
                        if (stripos($testText, $term) !== false) {
                            $shouldFilter = true;
                            break 2;
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'text' => $testText,
                    'should_filter' => $shouldFilter,
                    'filters_applied' => $filters
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fout bij testen privacy filters'
            ], 400);
        }
    }
}