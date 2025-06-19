<?php

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
            $table->longText('content')->nullable();
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