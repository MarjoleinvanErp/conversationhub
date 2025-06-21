<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    /**
     * Get meeting report
     */
    public function show(Request $request, Meeting $meeting): JsonResponse
    {
        try {
            // Check if user owns the meeting
            if ($meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot dit gesprek'
                ], 403);
            }

            $report = $meeting->report;

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen verslag gevonden voor dit gesprek'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $report
            ]);

        } catch (\Exception $e) {
            Log::error('Report show error', [
                'meeting_id' => $meeting->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij ophalen verslag'
            ], 500);
        }
    }

    /**
     * Update meeting report
     */
    public function update(Request $request, Meeting $meeting): JsonResponse
    {
        try {
            // Check if user owns the meeting
            if ($meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot dit gesprek'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'summary' => 'nullable|string|max:10000',
                'key_points' => 'nullable|array',
                'action_items' => 'nullable|array',
                'next_steps' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ongeldige data',
                    'errors' => $validator->errors()
                ], 422);
            }

            $report = $meeting->report;

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen verslag gevonden om bij te werken'
                ], 404);
            }

            $report->update([
                'summary' => $request->input('summary', $report->summary),
                'key_points' => $request->input('key_points', $report->key_points),
                'action_items' => $request->input('action_items', $report->action_items),
                'next_steps' => $request->input('next_steps', $report->next_steps),
                'last_edited_at' => now()
            ]);

            Log::info('Report updated', [
                'meeting_id' => $meeting->id,
                'report_id' => $report->id,
                'user_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verslag bijgewerkt',
                'data' => $report->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Report update error', [
                'meeting_id' => $meeting->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij bijwerken verslag'
            ], 500);
        }
    }

    /**
     * Generate basic report from meeting data
     */
    public function generate(Request $request, Meeting $meeting): JsonResponse
    {
        try {
            // Check if user owns the meeting
            if ($meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot dit gesprek'
                ], 403);
            }

            // Load meeting with relationships
            $meeting->load(['participants', 'agendaItems', 'transcriptions']);

            // Generate basic report data
            $reportData = $this->generateBasicReportData($meeting);

            // Create or update report
            $report = MeetingReport::updateOrCreate(
                ['meeting_id' => $meeting->id],
                [
                    'summary' => $reportData['summary'],
                    'key_points' => $reportData['key_points'],
                    'action_items' => $reportData['action_items'],
                    'next_steps' => $reportData['next_steps'],
                    'statistics' => $reportData['statistics'],
                    'generated_at' => now(),
                    'is_editable' => true
                ]
            );

            Log::info('Basic report generated', [
                'meeting_id' => $meeting->id,
                'report_id' => $report->id,
                'user_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Basis verslag gegenereerd',
                'data' => $report
            ]);

        } catch (\Exception $e) {
            Log::error('Report generation error', [
                'meeting_id' => $meeting->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij genereren verslag'
            ], 500);
        }
    }

    /**
     * Export raw meeting data
     */
    public function exportRaw(Request $request, Meeting $meeting): JsonResponse
    {
        try {
            // Check if user owns the meeting
            if ($meeting->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Geen toegang tot dit gesprek'
                ], 403);
            }

            // Load meeting with all relationships
            $meeting->load(['participants', 'agendaItems', 'transcriptions']);

            // Prepare raw data export
            $rawData = [
                'meeting' => [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'description' => $meeting->description,
                    'start_time' => $meeting->start_time?->toISOString(),
                    'end_time' => $meeting->end_time?->toISOString(),
                    'duration_minutes' => $meeting->duration,
                    'status' => $meeting->status,
                    'privacy_level' => $meeting->privacy_level,
                    'auto_transcribe' => $meeting->auto_transcribe,
                    'settings' => $meeting->settings,
                    'created_at' => $meeting->created_at->toISOString(),
                ],
                'participants' => $meeting->participants->map(function ($participant) {
                    return [
                        'id' => $participant->id,
                        'name' => $participant->name,
                        'email' => $participant->email,
                        'role' => $participant->role,
                        'consent_given' => $participant->consent_given,
                        'consent_at' => $participant->consent_at?->toISOString(),
                    ];
                }),
                'agenda_items' => $meeting->agendaItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'description' => $item->description,
                        'order' => $item->order,
                        'estimated_duration' => $item->estimated_duration,
                        'status' => $item->status,
                        'completed_at' => $item->completed_at?->toISOString(),
                    ];
                }),
                'transcriptions' => $meeting->transcriptions->map(function ($transcription) {
                    return [
                        'id' => $transcription->id,
                        'speaker_name' => $transcription->speaker_name,
                        'speaker_id' => $transcription->speaker_id,
                        'speaker_color' => $transcription->speaker_color,
                        'text' => $transcription->text,
                        'confidence' => $transcription->confidence,
                        'source' => $transcription->source,
                        'is_final' => $transcription->is_final,
                        'spoken_at' => $transcription->spoken_at?->toISOString(),
                        'created_at' => $transcription->created_at->toISOString(),
                    ];
                }),
                'statistics' => $this->calculateMeetingStatistics($meeting),
                'export_info' => [
                    'exported_at' => now()->toISOString(),
                    'exported_by' => $request->user()->id,
                    'version' => '1.0'
                ]
            ];

            Log::info('Raw data exported', [
                'meeting_id' => $meeting->id,
                'user_id' => $request->user()->id,
                'data_size' => strlen(json_encode($rawData))
            ]);

            return response()->json([
                'success' => true,
                'data' => $rawData
            ]);

        } catch (\Exception $e) {
            Log::error('Raw data export error', [
                'meeting_id' => $meeting->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fout bij exporteren ruwe data'
            ], 500);
        }
    }

    /**
     * Generate basic report data from meeting
     */
    private function generateBasicReportData(Meeting $meeting): array
    {
        $stats = $this->calculateMeetingStatistics($meeting);
        
        return [
            'summary' => $this->generateBasicSummary($meeting, $stats),
            'key_points' => $this->extractKeyPoints($meeting),
            'action_items' => $this->extractActionItems($meeting),
            'next_steps' => [],
            'statistics' => $stats
        ];
    }

    /**
     * Calculate meeting statistics
     */
    private function calculateMeetingStatistics(Meeting $meeting): array
    {
        $transcriptions = $meeting->transcriptions;
        $totalWords = $transcriptions->sum(function ($t) {
            return str_word_count($t->text);
        });

        $speakerStats = [];
        foreach ($transcriptions->groupBy('speaker_name') as $speaker => $speakerTranscriptions) {
            $speakerStats[$speaker] = [
                'segments' => $speakerTranscriptions->count(),
                'words' => $speakerTranscriptions->sum(function ($t) {
                    return str_word_count($t->text);
                }),
                'estimated_speaking_time' => $speakerTranscriptions->sum(function ($t) {
                    return str_word_count($t->text) / 2.5; // ~150 words per minute
                })
            ];
        }

        return [
            'duration_minutes' => $meeting->duration, // Using your computed duration attribute
            'total_transcriptions' => $transcriptions->count(),
            'total_words' => $totalWords,
            'participants_count' => $meeting->participants->count(),
            'agenda_items_count' => $meeting->agendaItems->count(),
            'speaker_statistics' => $speakerStats,
            'estimated_content_duration' => $totalWords / 150, // minutes
        ];
    }

    /**
     * Generate basic summary
     */
    private function generateBasicSummary(Meeting $meeting, array $stats): string
    {
        $duration = $meeting->duration ?? 0; // Using your computed duration attribute
        $participantCount = $meeting->participants->count();
        $agendaItemsCount = $meeting->agendaItems->count();
        
        $summary = "**Gesprekssamenvatting voor: {$meeting->title}**\n\n";
        $summary .= "**Datum & Tijd:** " . ($meeting->start_time ? $meeting->start_time->format('d-m-Y H:i') : 'Niet bekend') . "\n";
        $summary .= "**Duur:** {$duration} minuten\n";
        $summary .= "**Deelnemers:** {$participantCount} personen\n";
        $summary .= "**Agendapunten:** {$agendaItemsCount} items\n\n";

        if ($meeting->description) {
            $summary .= "**Doel van het gesprek:**\n{$meeting->description}\n\n";
        }

        $summary .= "**Belangrijkste gespreksonderwerpen:**\n";
        foreach ($meeting->agendaItems as $item) {
            $summary .= "- {$item->title}\n";
        }

        return $summary;
    }

    /**
     * Extract key points from transcriptions
     */
    private function extractKeyPoints(Meeting $meeting): array
    {
        $keyPoints = [];
        
        // Extract from agenda items
        foreach ($meeting->agendaItems as $item) {
            $keyPoints[] = [
                'topic' => $item->title,
                'description' => $item->description ?? '',
                'status' => $item->status ?? 'discussed'
            ];
        }

        return $keyPoints;
    }

    /**
     * Extract action items from transcriptions
     */
    private function extractActionItems(Meeting $meeting): array
    {
        $actionItems = [];
        
        // Simple pattern matching for action-oriented text
        $actionPatterns = [
            '/(?:we moeten|ik ga|je moet|hij moet|zij moet|we gaan)\s+(.+?)(?:\.|,|$)/i',
            '/(?:actie|taak|volgende stap|afspraak):\s*(.+?)(?:\.|,|$)/i'
        ];

        foreach ($meeting->transcriptions as $transcription) {
            foreach ($actionPatterns as $pattern) {
                if (preg_match_all($pattern, $transcription->text, $matches)) {
                    foreach ($matches[1] as $match) {
                        $actionItems[] = [
                            'action' => trim($match),
                            'speaker' => $transcription->speaker_name,
                            'mentioned_at' => $transcription->spoken_at?->toISOString()
                        ];
                    }
                }
            }
        }

        return array_slice($actionItems, 0, 10); // Limit to 10 items
    }
}