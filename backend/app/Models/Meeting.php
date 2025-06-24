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

    // PERFORMANCE: Eager load user by default om N+1 queries te voorkomen
    protected $with = ['user:id,name,email'];

    /**
     * Meeting belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    // PERFORMANCE: Static methods voor cached queries
    public static function getActiveForUser($userId)
    {
        $cacheKey = "active_meetings_user_{$userId}";
        
        return Cache::remember($cacheKey, 300, function () use ($userId) { // 5 minutes cache
            return static::active()
                          ->forUser($userId)
                          ->with(['participants:id,meeting_id,name,email'])
                          ->orderBy('start_time', 'desc')
                          ->get();
        });
    }

    public static function getRecentForUser($userId, $limit = 10)
    {
        $cacheKey = "recent_meetings_user_{$userId}_{$limit}";
        
        return Cache::remember($cacheKey, 600, function () use ($userId, $limit) { // 10 minutes cache
            return static::forUser($userId)
                          ->with(['participants:id,meeting_id,name,email'])
                          ->withCount(['transcriptions', 'agendaItems'])
                          ->orderBy('created_at', 'desc')
                          ->limit($limit)
                          ->get();
        });
    }


public function report(): HasOne
{
    return $this->hasOne(MeetingReport::class);
}


    // PERFORMANCE: Cache clearing when model changes
    protected static function booted()
    {
        static::saved(function ($meeting) {
            // Clear user-specific caches
            Cache::forget("active_meetings_user_{$meeting->user_id}");
            Cache::forget("recent_meetings_user_{$meeting->user_id}_10");
            Cache::forget("meeting_duration_{$meeting->id}");
        });

        static::deleted(function ($meeting) {
            // Clear user-specific caches
            Cache::forget("active_meetings_user_{$meeting->user_id}");
            Cache::forget("recent_meetings_user_{$meeting->user_id}_10");
            Cache::forget("meeting_duration_{$meeting->id}");
        });
    }
}