<?php
// File: backend/app/Models/N8NReport.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class N8NReport extends Model
{
    use HasFactory;

    protected $table = 'n8n_reports';

    protected $fillable = [
        'meeting_id',
        'user_id',
        'report_id',
        'status',
        'report_options',
        'content',
        'format',
        'estimated_completion',
        'requested_at',
        'completed_at',
        'error_message'
    ];

    protected $casts = [
        'report_options' => 'array',
        'content' => 'array',
        'estimated_completion' => 'datetime',
        'requested_at' => 'datetime',
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
        return $query->whereIn('status', ['requested', 'generating']);
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
        return in_array($this->status, ['requested', 'generating']);
    }

    public function getIsFailedAttribute(): bool
    {
        return $this->status === 'failed';
    }

    public function getHasContentAttribute(): bool
    {
        return !empty($this->content);
    }

    public function getFormattedContentAttribute(): string
    {
        if (is_array($this->content)) {
            return $this->content['text'] ?? json_encode($this->content, JSON_PRETTY_PRINT);
        }
        
        return $this->content ?? '';
    }
}

<?php
// File: backend/database/migrations/2024_06_19_120000_create_n8n_exports_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('n8n_exports', function (Blueprint $table) {
            $table->id();
            $table->uuid('export_id')->unique();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->enum('status', ['sent', 'processing', 'completed', 'failed'])->default('sent');
            $table->json('export_options')->nullable();
            $table->json('n8n_response')->nullable();
            $table->text('error_message')->nullable();
            
            $table->timestamp('exported_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['meeting_id', 'status']);
            $table->index(['user_id', 'created_at']);
            $table->index('export_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('n8n_exports');
    }
};

<?php
// File: backend/database/migrations/2024_06_19_121000_create_n8n_reports_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('n8n_reports', function (Blueprint $table) {
            $table->id();
            $table->uuid('report_id')->unique();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->enum('status', ['requested', 'generating', 'completed', 'failed'])->default('requested');
            $table->json('report_options')->nullable();
            $table->longText('content')->nullable(); // Can store large report content
            $table->string('format')->default('markdown');
            $table->text('error_message')->nullable();
            
            $table->timestamp('estimated_completion')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['meeting_id', 'status']);
            $table->index(['user_id', 'created_at']);
            $table->index('report_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('n8n_reports');
    }
};