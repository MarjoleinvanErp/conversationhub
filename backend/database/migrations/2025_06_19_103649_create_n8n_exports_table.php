<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('n8n_exports', function (Blueprint $table) {
            $table->id();
            $table->uuid('export_id')->unique();
            $table->foreignId('meeting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->enum('status', ['sent', 'processing', 'completed', 'failed'])->default('sent');
            $table->json('export_options')->nullable();
            $table->json('n8n_response')->nullable();
            $table->text('error_message')->nullable();
            
            $table->timestamp('exported_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['meeting_id', 'status']);
            $table->index(['user_id', 'created_at']);
            $table->index('export_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('n8n_exports');
    }
};