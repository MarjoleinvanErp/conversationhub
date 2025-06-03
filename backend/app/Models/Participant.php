<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Participant extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'name',
        'email',
        'role',
        'consent_given',
        'consent_at',
        'privacy_notes',
    ];

    protected $casts = [
        'consent_given' => 'boolean',
        'consent_at' => 'datetime',
    ];

    /**
     * Participant belongs to a meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }
}