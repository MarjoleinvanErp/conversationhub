<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('meeting_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // 'participatie_intake', 'algemeen_overleg', 'wmo_keukentafel'
            $table->string('display_name'); // 'Participatie Intake', 'Algemeen Overleg', 'WMO Keukentafelgesprek'
            $table->text('description')->nullable();
            
            // Privacy & Filtering Settings
            $table->json('privacy_filters')->nullable(); // Welke termen/woorden weg te filteren
            $table->json('participant_filters')->nullable(); // Welke rollen/personen weg te filteren
            $table->boolean('auto_anonymize')->default(false); // Automatisch anonimiseren
            
            // Standaard Agenda Items
            $table->json('default_agenda_items')->nullable(); // Standaard agendapunten voor dit type
            
            // Participant Role Configuration
            $table->json('allowed_participant_roles')->nullable(); // Welke rollen toegestaan
            $table->json('privacy_levels_by_role')->nullable(); // Privacy niveau per rol
            
            // Report Generation Settings
            $table->json('report_template')->nullable(); // Template voor AI rapport generatie
            $table->boolean('auto_generate_report')->default(true);
            $table->integer('estimated_duration_minutes')->nullable(); // Geschatte duur
            
            // Status & Metadata
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable(); // Extra configuratie
            $table->timestamps();
            
            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('meeting_types');
    }
};