<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('meetings', function (Blueprint $table) {
            // Nieuwe foreign key naar meeting_types
            $table->foreignId('meeting_type_id')->nullable()->constrained('meeting_types')->onDelete('restrict');
            $table->index('meeting_type_id');
        });
    }

    public function down()
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropForeign(['meeting_type_id']);
            $table->dropColumn('meeting_type_id');
        });
    }
};