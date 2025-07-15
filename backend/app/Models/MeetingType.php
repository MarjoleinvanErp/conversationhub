<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'display_name', 'description', 'privacy_filters',
        'participant_filters', 'auto_anonymize', 'default_agenda_items',
        'allowed_participant_roles', 'privacy_levels_by_role',
        'report_template', 'auto_generate_report', 'estimated_duration_minutes',
        'is_active', 'metadata'
    ];

    protected $casts = [
        'privacy_filters' => 'array',
        'participant_filters' => 'array',
        'default_agenda_items' => 'array',
        'allowed_participant_roles' => 'array',
        'privacy_levels_by_role' => 'array',
        'report_template' => 'array',
        'auto_anonymize' => 'boolean',
        'auto_generate_report' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array'
    ];

    // Relationships
    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    // Helper methods
    public function shouldFilterParticipantRole($role)
    {
        $filters = $this->participant_filters['exclude_from_report'] ?? [];
        return in_array($role, $filters);
    }

    public function shouldAnonymizeRole($role)
    {
        $filters = $this->participant_filters['anonymize_roles'] ?? [];
        return in_array($role, $filters);
    }

    public function getPrivacyLevelForRole($role)
    {
        return $this->privacy_levels_by_role[$role] ?? 'standard';
    }

    public function getDefaultAgendaItems()
    {
        return $this->default_agenda_items ?? [];
    }
}