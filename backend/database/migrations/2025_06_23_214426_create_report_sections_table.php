<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('report_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_report_id')->constrained()->onDelete('cascade');
            $table->foreignId('agenda_item_id')->nullable()->constrained()->onDelete('set null');
            
            // Section information
            $table->string('section_type'); // 'summary', 'agenda_item', 'action_items', 'decisions', 'custom'
            $table->string('title');
            $table->longText('content');
            $table->integer('order_index')->default(0);
            
            // Privacy and filtering
            $table->boolean('contains_privacy_info')->default(false);
            $table->json('privacy_markers')->nullable(); // Track what was filtered
            $table->longText('original_content')->nullable(); // Backup before privacy filtering
            
            // Editorial control
            $table->boolean('is_editable')->default(true);
            $table->boolean('is_auto_generated')->default(true);
            $table->foreignId('last_edited_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('last_edited_at')->nullable();
            
            // Metadata
            $table->json('metadata')->nullable(); // Speaker stats, confidence scores, etc.
            $table->timestamps();
            
            // Indexes
            $table->index(['meeting_report_id', 'order_index']);
            $table->index(['agenda_item_id']);
            $table->index(['section_type']);
            $table->index(['contains_privacy_info']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_sections');
    }
};