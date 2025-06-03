<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'template_id',
        'scheduled_at',
        'duration_minutes',
        'status',
        'privacy_level',
        'auto_transcription',
        'user_id',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'auto_transcription' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * Meeting belongs to a user (creator)
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
     * Meeting has many agenda items
     */
    public function agendaItems(): HasMany
    {
        return $this->hasMany(AgendaItem::class);
    }

    /**
     * Meeting has many transcriptions
     */
    public function transcriptions(): HasMany
    {
        return $this->hasMany(Transcription::class);
    }

    /**
     * Check if meeting is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if meeting is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}