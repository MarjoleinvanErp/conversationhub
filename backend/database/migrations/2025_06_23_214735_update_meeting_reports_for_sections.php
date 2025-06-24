<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meeting_reports', function (Blueprint $table) {
            // Privacy and editing control
            $table->boolean('privacy_filtered')->default(false)->after('metadata');
            $table->boolean('is_editable')->default(true)->after('privacy_filtered');
            $table->integer('version_number')->default(1)->after('is_editable');
            $table->enum('status', ['draft', 'final', 'archived'])->default('draft')->after('version_number');
            
            // Indexes for new columns
            $table->index(['meeting_id', 'version_number']);
            $table->index(['status']);
            $table->index(['privacy_filtered']);
        });
    }

    public function down(): void
    {
        Schema::table('meeting_reports', function (Blueprint $table) {
            $table->dropIndex(['meeting_id', 'version_number']);
            $table->dropIndex(['status']);
            $table->dropIndex(['privacy_filtered']);
            
            $table->dropColumn([
                'privacy_filtered',
                'is_editable', 
                'version_number',
                'status'
            ]);
        });
    }
};