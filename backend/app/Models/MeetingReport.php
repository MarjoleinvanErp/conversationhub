<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class MeetingReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'report_title',
        'report_content',
        'report_type',
        'generated_by',
        'generated_at',
        'metadata',
        'privacy_filtered',
        'is_editable',
        'version_number',
        'status'
    ];

    protected $casts = [
        'metadata' => 'array',
        'generated_at' => 'datetime',
        'privacy_filtered' => 'boolean',
        'is_editable' => 'boolean',
        'version_number' => 'integer'
    ];

    protected $attributes = [
        'report_type' => 'ai_generated',
        'generated_by' => 'N8N_AI_Agent',
        'privacy_filtered' => false,
        'is_editable' => true,
        'version_number' => 1,
        'status' => 'draft'
    ];

    /**
     * Relationships
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(ReportSection::class)->orderBy('order_index');
    }

    /**
     * Get sections grouped by type
     */
    public function getSectionsByType(): array
    {
        $grouped = [];
        foreach ($this->sections as $section) {
            $grouped[$section->section_type][] = $section;
        }
        return $grouped;
    }

    /**
     * Generate complete HTML output from sections
     */
    public function toHtml(): string
    {
        $html = '<div class="meeting-report">';
        
        // Report header
        $html .= '<div class="report-header">';
        $html .= '<h1>' . htmlspecialchars($this->report_title) . '</h1>';
        $html .= '<div class="report-meta">';
        $html .= '<p><strong>Meeting:</strong> ' . htmlspecialchars($this->meeting->title) . '</p>';
$scheduledAt = $this->meeting->scheduled_at;
if (is_string($scheduledAt)) {
    $scheduledAt = \Carbon\Carbon::parse($scheduledAt);
}
$html .= '<p><strong>Datum:</strong> ' . ($scheduledAt ? $scheduledAt->format('d-m-Y H:i') : 'Niet bekend') . '</p>';


        $html .= '<p><strong>Gegenereerd op:</strong> ' . $this->generated_at?->format('d-m-Y H:i') . '</p>';
        if ($this->privacy_filtered) {
            $html .= '<p class="privacy-notice"><em>⚠️ Privacy-gevoelige informatie is gefilterd</em></p>';
        }
        $html .= '</div>';
        $html .= '</div>';

        // Render sections in order
        foreach ($this->sections as $section) {
            $html .= '<div class="report-section" data-section-type="' . $section->section_type . '">';
            
            // Section header
            $html .= '<div class="section-header">';
            $html .= '<h2>' . htmlspecialchars($section->title) . '</h2>';
            
            if ($section->contains_privacy_info) {
                $html .= '<span class="privacy-indicator">🔒 Privacy gefilterd</span>';
            }
            
            if (!$section->is_auto_generated && $section->last_edited_at) {
                $html .= '<small class="edit-info">Handmatig bewerkt op ' . $section->last_edited_at->format('d-m-Y H:i') . '</small>';
            }
            
            $html .= '</div>';
            
            // Section content
            $html .= '<div class="section-content">';
            $html .= nl2br(htmlspecialchars($section->content));
            $html .= '</div>';
            
            $html .= '</div>';
        }

        $html .= '</div>';
        return $html;
    }

    /**
     * Apply privacy filtering to all sections
     */
    public function applyPrivacyFiltering(): void
    {
        foreach ($this->sections as $section) {
            $section->applyPrivacyFiltering();
        }
        
        $this->update(['privacy_filtered' => true]);
    }

    /**
     * Create a new version of this report
     */
    public function createNewVersion(): self
    {
        $newReport = $this->replicate();
        $newReport->version_number = $this->version_number + 1;
        $newReport->status = 'draft';
        $newReport->save();

        // Copy all sections
        foreach ($this->sections as $section) {
            $newSection = $section->replicate();
            $newSection->meeting_report_id = $newReport->id;
            $newSection->save();
        }

        return $newReport;
    }

    /**
     * Check if report has privacy-sensitive content
     */
    public function hasPrivacyContent(): bool
    {
        return $this->sections()->where('contains_privacy_info', true)->exists();
    }

    /**
     * Legacy support - get old-style report data from sections
     */
    public function getLegacyDataAttribute(): array
    {
        $sections = $this->getSectionsByType();
        
        return [
            'summary' => $sections['summary'][0]->content ?? '',
            'key_points' => $this->extractKeyPointsFromSections(),
            'action_items' => $this->extractActionItemsFromSections(),
            'next_steps' => [],
            'statistics' => $this->metadata['meeting_stats'] ?? []
        ];
    }

    /**
     * Extract key points from sections for backward compatibility
     */
    private function extractKeyPointsFromSections(): array
    {
        $keyPoints = [];
        foreach ($this->sections as $section) {
            if ($section->section_type === 'agenda_item') {
                $keyPoints[] = [
                    'topic' => $section->title,
                    'description' => $section->content
                ];
            }
        }
        return $keyPoints;
    }

    /**
     * Extract action items from sections for backward compatibility
     */
    private function extractActionItemsFromSections(): array
    {
        $actionSections = $this->sections()->where('section_type', 'action_items')->get();
        $actionItems = [];
        
        foreach ($actionSections as $section) {
            $lines = explode("\n", $section->content);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line && strpos($line, '•') === 0) {
                    $actionItems[] = ['action' => ltrim($line, '• ')];
                }
            }
        }
        
        return $actionItems;
    }
}