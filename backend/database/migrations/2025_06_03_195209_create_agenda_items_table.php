<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->integer('estimated_duration')->nullable(); // minutes
            $table->string('status')->default('pending'); // pending, active, completed, skipped
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['meeting_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_items');
    }
};