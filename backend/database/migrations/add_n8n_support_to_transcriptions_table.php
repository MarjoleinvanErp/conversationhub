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
            // Add source field if it doesn't exist
            if (!Schema::hasColumn('transcriptions', 'source')) {
                $table->string('source', 50)->default('live')->after('text')
                    ->comment('Source of transcription: live, whisper, n8n');
            }

            // Add speaker confidence if it doesn't exist
            if (!Schema::hasColumn('transcriptions', 'speaker_confidence')) {
                $table->decimal('speaker_confidence', 3, 2)->nullable()->after('confidence')
                    ->comment('Confidence score for speaker identification');
            }

            // Add metadata JSON field if it doesn't exist
            if (!Schema::hasColumn('transcriptions', 'metadata')) {
                $table->json('metadata')->nullable()->after('processing_status')
                    ->comment('Additional metadata like session_id, chunk_number, etc.');
            }

            // Add processing status if it doesn't exist
            if (!Schema::hasColumn('transcriptions', 'processing_status')) {
                $table->string('processing_status', 50)->default('completed')->after('is_final')
                    ->comment('Status: pending, processing, completed, failed');
            }

            // Add spoken_at timestamp if it doesn't exist
            if (!Schema::hasColumn('transcriptions', 'spoken_at')) {
                $table->timestamp('spoken_at')->nullable()->after('updated_at')
                    ->comment('When the text was actually spoken');
            }

            // Update existing source column if needed
            if (Schema::hasColumn('transcriptions', 'source')) {
                $table->string('source', 50)->default('live')->change();
            }
        });

        // Add index for performance
        Schema::table('transcriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('transcriptions', 'source') || 
                !$this->hasIndex('transcriptions', 'transcriptions_source_index')) {
                $table->index('source');
            }
            
            if (!Schema::hasColumn('transcriptions', 'processing_status') || 
                !$this->hasIndex('transcriptions', 'transcriptions_processing_status_index')) {
                $table->index('processing_status');
            }
            
            if (!Schema::hasColumn('transcriptions', 'spoken_at') || 
                !$this->hasIndex('transcriptions', 'transcriptions_spoken_at_index')) {
                $table->index('spoken_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transcriptions', function (Blueprint $table) {
            // Remove columns added in up() method
            $columnsToRemove = ['source', 'speaker_confidence', 'metadata', 'processing_status', 'spoken_at'];
            
            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('transcriptions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        // Remove indexes
        Schema::table('transcriptions', function (Blueprint $table) {
            $indexesToRemove = [
                'transcriptions_source_index',
                'transcriptions_processing_status_index', 
                'transcriptions_spoken_at_index'
            ];
            
            foreach ($indexesToRemove as $index) {
                if ($this->hasIndex('transcriptions', $index)) {
                    $table->dropIndex($index);
                }
            }
        });
    }

    /**
     * Check if table has specific index
     */
    private function hasIndex(string $table, string $index): bool
    {
        $indexes = Schema::getConnection()->getDoctrineSchemaManager()
            ->listTableIndexes($table);
            
        return array_key_exists($index, $indexes);
    }
};