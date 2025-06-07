<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transcription extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'speaker_name',
        'speaker_id',
        'speaker_color',
        'text',
        'confidence',
        'source',
        'is_final',
        'spoken_at',
    ];

    protected $casts = [
        'confidence' => 'decimal:2',
        'is_final' => 'boolean',
        'spoken_at' => 'datetime',
    ];

    /**
     * Transcription belongs to a meeting
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }
}