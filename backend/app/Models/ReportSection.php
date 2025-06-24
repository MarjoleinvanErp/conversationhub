<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_report_id',
        'agenda_item_id',
        'section_type',
        'title',
        'content',
        'order_index',
        'contains_privacy_info',
        'privacy_markers',
        'original_content',
        'is_editable',
        'is_auto_generated',
        'last_edited_by',
        'last_edited_at',
        'metadata'
    ];

    protected $casts = [
        'privacy_markers' => 'array',
        'metadata' => 'array',
        'contains_privacy_info' => 'boolean',
        'is_editable' => 'boolean',
        'is_auto_generated' => 'boolean',
        'last_edited_at' => 'datetime'
    ];

    /**
     * Relationships
     */
    public function meetingReport(): BelongsTo
    {
        return $this->belongsTo(MeetingReport::class);
    }

    public function agendaItem(): BelongsTo
    {
        return $this->belongsTo(AgendaItem::class);
    }

    public function lastEditedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    /**
     * Apply privacy filtering to content
     */
    public function applyPrivacyFiltering(): void
    {
        if ($this->contains_privacy_info) {
            return; // Already filtered
        }

        $originalContent = $this->content;
        $filteredContent = $originalContent;
        $foundMarkers = [];

        // Privacy patterns for Dutch content
        $privacyPatterns = [
            'phone' => '/\b(\+31|0031|0)\s*[1-9]\s*(?:\d\s*){8}\b/',
            'email' => '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/',
            'bsn' => '/\b\d{9}\b/',
            'postcode' => '/\b\d{4}\s*[A-Z]{2}\b/',
            'iban' => '/\bNL\d{2}[A-Z]{4}\d{10}\b/',
        ];

        foreach ($privacyPatterns as $type => $pattern) {
            if (preg_match_all($pattern, $filteredContent, $matches)) {
                $foundMarkers[$type] = count($matches[0]);
                $filteredContent = preg_replace($pattern, '[PRIVACY_FILTERED_' . strtoupper($type) . ']', $filteredContent);
            }
        }

        if (!empty($foundMarkers)) {
            $this->update([
                'original_content' => $originalContent,
                'content' => $filteredContent,
                'contains_privacy_info' => true,
                'privacy_markers' => $foundMarkers
            ]);
        }
    }

    /**
     * Update content and track editing
     */
    public function updateContent(string $newContent, int $userId): void
    {
        $this->update([
            'content' => $newContent,
            'is_auto_generated' => false,
            'last_edited_by' => $userId,
            'last_edited_at' => now()
        ]);
    }
}