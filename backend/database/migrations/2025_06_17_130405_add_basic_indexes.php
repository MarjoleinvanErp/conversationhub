<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - PERFORMANCE INDEXES
     */
    public function up()
    {
        // Check if meetings table exists before adding indexes
        if (Schema::hasTable('meetings')) {
            Schema::table('meetings', function (Blueprint $table) {
                // Index voor user_id en status queries (meest gebruikte combinatie)
                $table->index(['user_id', 'status'], 'meetings_user_status_idx');
                
                // Index voor created_at (voor recent queries)
                $table->index('created_at', 'meetings_created_idx');
            });
        }

        // Check if participants table exists
        if (Schema::hasTable('participants')) {
            Schema::table('participants', function (Blueprint $table) {
                // Index voor meeting_id queries
                $table->index('meeting_id', 'participants_meeting_idx');
            });
        }

        // Check if transcriptions table exists
        if (Schema::hasTable('transcriptions')) {
            Schema::table('transcriptions', function (Blueprint $table) {
                // Index voor meeting_id queries
                $table->index('meeting_id', 'transcriptions_meeting_idx');
                
                // Index voor created_at (voor chronologische queries)
                $table->index('created_at', 'transcriptions_created_idx');
            });
        }

        // Check if agenda_items table exists
        if (Schema::hasTable('agenda_items')) {
            Schema::table('agenda_items', function (Blueprint $table) {
                // Index voor meeting_id queries
                $table->index('meeting_id', 'agenda_meeting_idx');
            });
        }
    }

    /**
     * Reverse the migrations
     */
    public function down()
    {
        if (Schema::hasTable('meetings')) {
            Schema::table('meetings', function (Blueprint $table) {
                $table->dropIndex('meetings_user_status_idx');
                $table->dropIndex('meetings_created_idx');
            });
        }

        if (Schema::hasTable('participants')) {
            Schema::table('participants', function (Blueprint $table) {
                $table->dropIndex('participants_meeting_idx');
            });
        }

        if (Schema::hasTable('transcriptions')) {
            Schema::table('transcriptions', function (Blueprint $table) {
                $table->dropIndex('transcriptions_meeting_idx');
                $table->dropIndex('transcriptions_created_idx');
            });
        }

        if (Schema::hasTable('agenda_items')) {
            Schema::table('agenda_items', function (Blueprint $table) {
                $table->dropIndex('agenda_meeting_idx');
            });
        }
    }
};