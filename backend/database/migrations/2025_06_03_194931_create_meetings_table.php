<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('general'); // general, participation, care, education
            $table->unsignedBigInteger('template_id')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->integer('duration_minutes')->default(60);
            $table->string('status')->default('scheduled'); // scheduled, active, completed, cancelled
            $table->string('privacy_level')->default('standard'); // minimal, standard, detailed
            $table->boolean('auto_transcription')->default(true);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('scheduled_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};