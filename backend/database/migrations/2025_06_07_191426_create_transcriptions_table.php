<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->string('speaker_name');
            $table->string('speaker_id')->nullable();
            $table->string('speaker_color')->default('#6B7280');
            $table->text('text');
            $table->decimal('confidence', 3, 2)->default(0.8);
            $table->string('source')->default('live');
            $table->boolean('is_final')->default(true);
            $table->timestamp('spoken_at');
            $table->timestamps();

            $table->index(['meeting_id', 'spoken_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcriptions');
    }
};