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
        Schema::table('transcriptions', function (Blueprint $table) {
            // Check als kolommen nog niet bestaan (voor veiligheid)
            if (!Schema::hasColumn('transcriptions', 'speaker_confidence')) {
                $table->decimal('speaker_confidence', 5, 3)->nullable()->after('confidence')->comment('Confidence score for speaker identification (0.000-1.000)');
            }
            
            if (!Schema::hasColumn('transcriptions', 'speaker_metadata')) {
                $table->json('speaker_metadata')->nullable()->after('speaker_confidence')->comment('Additional speaker detection metadata');
            }
            
            // Enhanced metadata field als het nog niet bestaat
            if (!Schema::hasColumn('transcriptions', 'metadata')) {
                $table->json('metadata')->nullable()->after('speaker_metadata')->comment('General metadata for transcription processing');
            }
        });

        // Index toevoegen in aparte stap - SIMPLIFIED zonder Doctrine check
        try {
            Schema::table('transcriptions', function (Blueprint $table) {
                $table->index(['speaker_id', 'speaker_confidence'], 'idx_speaker_detection');
            });
        } catch (\Exception $e) {
            // Index creation failed - not critical, continue
            \Illuminate\Support\Facades\Log::warning('Failed to create speaker detection index: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop index eerst (als het bestaat)
        try {
            Schema::table('transcriptions', function (Blueprint $table) {
                $table->dropIndex('idx_speaker_detection');
            });
        } catch (\Exception $e) {
            // Index doesn't exist, that's fine
        }

        Schema::table('transcriptions', function (Blueprint $table) {
            // Drop kolommen
            if (Schema::hasColumn('transcriptions', 'speaker_confidence')) {
                $table->dropColumn('speaker_confidence');
            }
            if (Schema::hasColumn('transcriptions', 'speaker_metadata')) {
                $table->dropColumn('speaker_metadata');
            }
            // Let metadata staan - die kan door andere features gebruikt worden
        });
    }
};