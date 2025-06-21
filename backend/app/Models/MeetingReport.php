<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'summary',
        'key_points',
        'action_items',
        'next_steps',
        'statistics',
        'n8n_response',
        'generated_at',
        'is_editable',
        'last_edited_at',
        'html_content'
    ];

    protected $casts = [
        'key_points' => 'array',
        'action_items' => 'array',
        'next_steps' => 'array',
        'statistics' => 'array',
        'n8n_response' => 'array',
        'generated_at' => 'datetime',
        'is_editable' => 'boolean',
        'last_edited_at' => 'datetime',
    ];

    /**
     * Meeting report belongs to a meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Generate HTML content from the report data
     */
    public function generateHtmlContent(): string
    {
        $meeting = $this->meeting;
        
        $html = '<div class="meeting-report">';
        
        // Header
        $html .= '<div class="report-header">';
        $html .= '<h1>' . htmlspecialchars($meeting->title) . '</h1>';
        $html .= '<div class="report-meta">';
        $html .= '<p><strong>Datum:</strong> ' . ($meeting->start_time ? $meeting->start_time->format('d-m-Y H:i') : 'Niet bekend') . '</p>';
        $html .= '<p><strong>Duur:</strong> ' . ($meeting->duration ?? 0) . ' minuten</p>';
        $html .= '<p><strong>Gegenereerd:</strong> ' . $this->generated_at->format('d-m-Y H:i') . '</p>';
        $html .= '</div>';
        $html .= '</div>';

        // Summary
        if ($this->summary) {
            $html .= '<div class="report-section">';
            $html .= '<h2>Samenvatting</h2>';
            $html .= '<div class="content">' . nl2br(htmlspecialchars($this->summary)) . '</div>';
            $html .= '</div>';
        }

        // Participants
        $participants = $meeting->participants;
        if ($participants->count() > 0) {
            $html .= '<div class="report-section">';
            $html .= '<h2>Deelnemers</h2>';
            $html .= '<ul>';
            foreach ($participants as $participant) {
                $html .= '<li>' . htmlspecialchars($participant->name);
                if ($participant->role) {
                    $html .= ' (' . htmlspecialchars($participant->role) . ')';
                }
                $html .= '</li>';
            }
            $html .= '</ul>';
            $html .= '</div>';
        }

        // Agenda items
        $agendaItems = $meeting->agendaItems;
        if ($agendaItems->count() > 0) {
            $html .= '<div class="report-section">';
            $html .= '<h2>Agendapunten</h2>';
            $html .= '<ol>';
            foreach ($agendaItems as $item) {
                $html .= '<li>';
                $html .= '<strong>' . htmlspecialchars($item->title) . '</strong>';
                if ($item->description) {
                    $html .= '<br><em>' . htmlspecialchars($item->description) . '</em>';
                }
                $html .= '</li>';
            }
            $html .= '</ol>';
            $html .= '</div>';
        }

        // Key points
        if (!empty($this->key_points)) {
            $html .= '<div class="report-section">';
            $html .= '<h2>Belangrijkste Punten</h2>';
            $html .= '<ul>';
            foreach ($this->key_points as $point) {
                if (is_array($point)) {
                    $html .= '<li><strong>' . htmlspecialchars($point['topic'] ?? '') . '</strong>';
                    if (!empty($point['description'])) {
                        $html .= ': ' . htmlspecialchars($point['description']);
                    }
                    $html .= '</li>';
                } else {
                    $html .= '<li>' . htmlspecialchars($point) . '</li>';
                }
            }
            $html .= '</ul>';
            $html .= '</div>';
        }

        // Action items
        if (!empty($this->action_items)) {
            $html .= '<div class="report-section">';
            $html .= '<h2>Actiepunten</h2>';
            $html .= '<ul>';
            foreach ($this->action_items as $action) {
                if (is_array($action)) {
                    $html .= '<li>' . htmlspecialchars($action['action'] ?? '');
                    if (!empty($action['speaker'])) {
                        $html .= ' <em>(Genoemd door: ' . htmlspecialchars($action['speaker']) . ')</em>';
                    }
                    $html .= '</li>';
                } else {
                    $html .= '<li>' . htmlspecialchars($action) . '</li>';
                }
            }
            $html .= '</ul>';
            $html .= '</div>';
        }

        // Next steps
        if (!empty($this->next_steps)) {
            $html .= '<div class="report-section">';
            $html .= '<h2>Vervolgstappen</h2>';
            $html .= '<ul>';
            foreach ($this->next_steps as $step) {
                if (is_array($step)) {
                    $html .= '<li>' . htmlspecialchars($step['step'] ?? $step['action'] ?? '');
                    if (!empty($step['deadline'])) {
                        $html .= ' <em>(Deadline: ' . htmlspecialchars($step['deadline']) . ')</em>';
                    }
                    if (!empty($step['responsible'])) {
                        $html .= ' <em>(Verantwoordelijke: ' . htmlspecialchars($step['responsible']) . ')</em>';
                    }
                    $html .= '</li>';
                } else {
                    $html .= '<li>' . htmlspecialchars($step) . '</li>';
                }
            }
            $html .= '</ul>';
            $html .= '</div>';
        }

        // Statistics
        if (!empty($this->statistics)) {
            $stats = $this->statistics;
            $html .= '<div class="report-section">';
            $html .= '<h2>Gespreksstatistieken</h2>';
            $html .= '<div class="stats-grid">';
            
            if (isset($stats['duration_minutes'])) {
                $html .= '<div class="stat-item"><strong>Duur:</strong> ' . $stats['duration_minutes'] . ' minuten</div>';
            }
            if (isset($stats['total_words'])) {
                $html .= '<div class="stat-item"><strong>Totaal woorden:</strong> ' . number_format($stats['total_words']) . '</div>';
            }
            if (isset($stats['participants_count'])) {
                $html .= '<div class="stat-item"><strong>Deelnemers:</strong> ' . $stats['participants_count'] . '</div>';
            }
            if (isset($stats['total_transcriptions'])) {
                $html .= '<div class="stat-item"><strong>Transcriptie segmenten:</strong> ' . $stats['total_transcriptions'] . '</div>';
            }
            
            $html .= '</div>';
            $html .= '</div>';
        }

        $html .= '</div>';

        // Add CSS styling
        $html .= $this->getReportCss();

        return $html;
    }

    /**
     * Get CSS styling for the HTML report
     */
    private function getReportCss(): string
    {
        return '
        <style>
        .meeting-report {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .report-header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .report-header h1 {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 28px;
            font-weight: 700;
        }
        
        .report-meta {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .report-meta p {
            margin: 5px 0;
            color: #6b7280;
        }
        
        .report-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        
        .report-section h2 {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 20px;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
        }
        
        .report-section .content {
            color: #374151;
            line-height: 1.7;
        }
        
        .report-section ul, .report-section ol {
            margin: 0;
            padding-left: 20px;
        }
        
        .report-section li {
            margin-bottom: 8px;
            color: #374151;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .stat-item {
            padding: 12px;
            background: #f3f4f6;
            border-radius: 6px;
            color: #374151;
        }
        
        em {
            color: #6b7280;
            font-style: italic;
        }
        
        strong {
            color: #1f2937;
            font-weight: 600;
        }
        
        @media print {
            .meeting-report {
                max-width: none;
                padding: 10px;
            }
            
            .report-section {
                break-inside: avoid;
                border: 1px solid #ccc;
            }
        }
        </style>';
    }

    /**
     * Update HTML content when report is saved
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($report) {
            $report->html_content = $report->generateHtmlContent();
        });
    }