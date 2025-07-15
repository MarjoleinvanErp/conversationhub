<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'meeting_type_id',
        'title',
        'description', 
        'start_time',
        'end_time',
        'status',
        'privacy_level',
        'auto_transcribe',
        'settings',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'auto_transcribe' => 'boolean',
        'settings' => 'array',
    ];

    // PERFORMANCE: Eager load user and meeting type by default om N+1 queries te voorkomen
    protected $with = ['user:id,name,email', 'meetingType:id,name,display_name'];

    /**
     * Meeting belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Meeting belongs to a meeting type
     */
    public function meetingType(): BelongsTo
    {
        return $this->belongsTo(MeetingType::class);
    }

    /**
     * Meeting has many participants
     */
    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    /**
     * Meeting has many transcriptions
     */
    public function transcriptions(): HasMany
    {
        return $this->hasMany(Transcription::class);
    }

    /**
     * Meeting has many agenda items
     */
    public function agendaItems(): HasMany
    {
        return $this->hasMany(AgendaItem::class);
    }

    /**
     * Meeting has many reports
     */
    public function reports(): HasMany
    {
        return $this->hasMany(MeetingReport::class);
    }

    /**
     * Meeting has one primary report
     */
    public function report(): HasOne
    {
        return $this->hasOne(MeetingReport::class);
    }

    /**
     * Meeting has many N8N exports
     */
    public function n8nExports(): HasMany
    {
        return $this->hasMany(N8NExport::class);
    }

    /**
     * Meeting has many N8N reports
     */
    public function n8nReports(): HasMany
    {
        return $this->hasMany(N8NReport::class);
    }

    // PERFORMANCE: Scoped queries voor betere performance
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeByType($query, $meetingTypeId)
    {
        return $query->where('meeting_type_id', $meetingTypeId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    // PERFORMANCE: Cache expensive computed properties
    public function getDurationAttribute()
    {
        if (!$this->start_time || !$this->end_time) {
            return null;
        }
        
        $cacheKey = "meeting_duration_{$this->id}";
        
        return Cache::remember($cacheKey, 1800, function () { // 30 minutes cache
            return $this->start_time->diffInMinutes($this->end_time);
        });
    }

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'scheduled' => 'Gepland',
            'active' => 'Actief',
            'completed' => 'Voltooid',
            'cancelled' => 'Geannuleerd',
            default => 'Onbekend'
        };
    }

    public function getMeetingTypeNameAttribute()
    {
        return $this->meetingType?->display_name ?? 'Onbekend Type';
    }

    // PRIVACY & FILTERING METHODS
    public function shouldFilterContent($content, $participantRole = null)
    {
        if (!$this->meetingType) {
            return false;
        }

        $filters = $this->meetingType->privacy_filters;
        
        // Check medical terms
        if (isset($filters['medical_terms'])) {
            foreach ($filters['medical_terms'] as $term) {
                if (stripos($content, $term) !== false) {
                    return true;
                }
            }
        }
        
        // Check sensitive topics
        if (isset($filters['sensitive_topics'])) {
            foreach ($filters['sensitive_topics'] as $term) {
                if (stripos($content, $term) !== false) {
                    return true;
                }
            }
        }
        
        // Check personal data
        if (isset($filters['personal_data'])) {
            foreach ($filters['personal_data'] as $term) {
                if (stripos($content, $term) !== false) {
                    return true;
                }
            }
        }
        
        // Check participant role filters
        if ($participantRole && $this->meetingType->shouldFilterParticipantRole($participantRole)) {
            return true;
        }
        
        return false;
    }

    public function shouldAnonymizeParticipant($participantRole)
    {
        if (!$this->meetingType) {
            return false;
        }

        return $this->meetingType->shouldAnonymizeRole($participantRole);
    }

    public function getPrivacyLevelForParticipant($participantRole)
    {
        if (!$this->meetingType) {
            return 'standard';
        }

        return $this->meetingType->getPrivacyLevelForRole($participantRole);
    }

    public function requiresAutoAnonymization()
    {
        return $this->meetingType?->auto_anonymize ?? false;
    }

    public function canGenerateAutoReport()
    {
        return $this->meetingType?->auto_generate_report ?? true;
    }

    public function getReportTemplate()
    {
        return $this->meetingType?->report_template ?? [];
    }

    public function getDefaultAgendaItems()
    {
        return $this->meetingType?->getDefaultAgendaItems() ?? [];
    }

    public function getEstimatedDuration()
    {
        return $this->meetingType?->estimated_duration_minutes ?? 60;
    }

    // VALIDATION & BUSINESS LOGIC
    public function canAddParticipantWithRole($role)
    {
        if (!$this->meetingType) {
            return true; // Default allow if no type specified
        }

        $allowedRoles = $this->meetingType->allowed_participant_roles ?? [];
        return empty($allowedRoles) || in_array($role, $allowedRoles);
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function isScheduled()
    {
        return $this->status === 'scheduled';
    }

    public function hasTranscriptions()
    {
        return $this->transcriptions()->exists();
    }

    public function hasReport()
    {
        return $this->reports()->exists();
    }

    public function hasAgenda()
    {
        return $this->agendaItems()->exists();
    }

    // PERFORMANCE: Static methods voor cached queries
    public static function getActiveForUser($userId)
    {
        $cacheKey = "active_meetings_user_{$userId}";
        
        return Cache::remember($cacheKey, 300, function () use ($userId) { // 5 minutes cache
            return static::active()
                          ->forUser($userId)
                          ->with(['participants:id,meeting_id,name,email,role'])
                          ->orderBy('start_time', 'desc')
                          ->get();
        });
    }

    public static function getRecentForUser($userId, $limit = 10)
    {
        $cacheKey = "recent_meetings_user_{$userId}_{$limit}";
        
        return Cache::remember($cacheKey, 600, function () use ($userId, $limit) { // 10 minutes cache
            return static::forUser($userId)
                          ->with(['participants:id,meeting_id,name,email,role'])
                          ->withCount(['transcriptions', 'agendaItems', 'reports'])
                          ->orderBy('created_at', 'desc')
                          ->limit($limit)
                          ->get();
        });
    }

    public static function getByTypeForUser($userId, $meetingTypeId)
    {
        $cacheKey = "meetings_user_{$userId}_type_{$meetingTypeId}";
        
        return Cache::remember($cacheKey, 900, function () use ($userId, $meetingTypeId) { // 15 minutes cache
            return static::forUser($userId)
                          ->byType($meetingTypeId)
                          ->with(['participants:id,meeting_id,name,email,role'])
                          ->withCount(['transcriptions', 'agendaItems', 'reports'])
                          ->orderBy('start_time', 'desc')
                          ->get();
        });
    }

    public static function getCompletedWithoutReports()
    {
        return static::completed()
                     ->doesntHave('reports')
                     ->with(['meetingType:id,name,auto_generate_report'])
                     ->whereHas('meetingType', function ($query) {
                         $query->where('auto_generate_report', true);
                     })
                     ->get();
    }

    // AGENDA MANAGEMENT
    public function createDefaultAgenda()
    {
        if (!$this->meetingType || $this->hasAgenda()) {
            return false;
        }

        $defaultItems = $this->getDefaultAgendaItems();
        $order = 1;

        foreach ($defaultItems as $item) {
            $this->agendaItems()->create([
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'estimated_duration' => $item['estimated_duration'] ?? null,
                'order' => $order++,
                'status' => 'pending'
            ]);
        }

        return true;
    }

    // PRIVACY HELPERS
    public function getFilteredTranscriptions($userRole = null)
    {
        $transcriptions = $this->transcriptions;
        
        if (!$this->requiresAutoAnonymization()) {
            return $transcriptions;
        }

        return $transcriptions->map(function ($transcription) use ($userRole) {
            if ($this->shouldFilterContent($transcription->text, $transcription->speaker_role)) {
                $transcription->text = '[GEFILTERD VOOR PRIVACY]';
            }
            
            if ($this->shouldAnonymizeParticipant($transcription->speaker_role)) {
                $transcription->speaker_name = $this->getAnonymizedSpeakerName($transcription->speaker_role);
            }
            
            return $transcription;
        });
    }

    private function getAnonymizedSpeakerName($role)
    {
        return match($role) {
            'client' => 'Cliënt',
            'casemanager' => 'Casemanager',
            'consulent' => 'Consulent',
            'wmo_consulent' => 'WMO Consulent',
            'zorgprofessional' => 'Zorgprofessional',
            'begeleider' => 'Begeleider',
            'mantelzorger' => 'Mantelzorger',
            default => 'Deelnemer'
        };
    }

    // PERFORMANCE: Cache clearing when model changes
    protected static function booted()
    {
        static::saved(function ($meeting) {
            // Clear user-specific caches
            Cache::forget("active_meetings_user_{$meeting->user_id}");
            Cache::forget("recent_meetings_user_{$meeting->user_id}_10");
            Cache::forget("meeting_duration_{$meeting->id}");
            
            // Clear type-specific caches
            if ($meeting->meeting_type_id) {
                Cache::forget("meetings_user_{$meeting->user_id}_type_{$meeting->meeting_type_id}");
            }
        });

        static::deleted(function ($meeting) {
            // Clear user-specific caches
            Cache::forget("active_meetings_user_{$meeting->user_id}");
            Cache::forget("recent_meetings_user_{$meeting->user_id}_10");
            Cache::forget("meeting_duration_{$meeting->id}");
            
            // Clear type-specific caches
            if ($meeting->meeting_type_id) {
                Cache::forget("meetings_user_{$meeting->user_id}_type_{$meeting->meeting_type_id}");
            }
        });
    }
}