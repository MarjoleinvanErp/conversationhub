<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('role')->default('participant'); // participant, facilitator, observer
            $table->boolean('consent_given')->default(false);
            $table->timestamp('consent_at')->nullable();
            $table->text('privacy_notes')->nullable();
            $table->timestamps();

            $table->index('meeting_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};