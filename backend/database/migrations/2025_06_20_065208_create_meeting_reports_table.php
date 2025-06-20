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
        Schema::create('meeting_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('meeting_id');
            $table->string('report_title');
            $table->longText('report_content');
            $table->string('report_type')->default('ai_generated');
            $table->string('generated_by')->default('N8N_AI_Agent');
            $table->timestamp('generated_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('meeting_id')->references('id')->on('meetings')->onDelete('cascade');
            
            // Indexes
            $table->index('meeting_id');
            $table->index('report_type');
            $table->index('generated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_reports');
    }
};