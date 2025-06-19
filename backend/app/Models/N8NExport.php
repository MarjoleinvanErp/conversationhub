<?php
// File: backend/app/Models/N8NExport.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class N8NExport extends Model
{
    use HasFactory;

    protected $table = 'n8n_exports';

    protected $fillable = [
        'meeting_id',
        'user_id',
        'export_id',
        'status',
        'export_options',
        'n8n_response',
        'error_message',
        'exported_at',
        'completed_at'
    ];

    protected $casts = [
        'export_options' => 'array',
        'n8n_response' => 'array',
        'exported_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['sent', 'processing']);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    // Accessors
    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }

    public function getIsPendingAttribute(): bool
    {
        return in_array($this->status, ['sent', 'processing']);
    }

    public function getIsFailedAttribute(): bool
    {
        return $this->status === 'failed';
    }
}

