<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Existing services
        $this->app->singleton(\App\Services\AudioProcessingService::class);
        $this->app->singleton(\App\Services\AzureWhisperService::class);
        $this->app->singleton(\App\Services\PrivacyFilterService::class);
        $this->app->singleton(\App\Services\N8nIntegrationService::class);
        $this->app->singleton(\App\Services\N8NService::class);

        // NEW: Meeting Service (was missing!)
        $this->app->singleton(\App\Services\MeetingService::class, function ($app) {
            return new \App\Services\MeetingService();
        });

        // NEW: Voice Service voor speaker identification
        $this->app->singleton(\App\Services\VoiceService::class, function ($app) {
            return new \App\Services\VoiceService();
        });

        // Enhanced services - UPDATE: met VoiceService dependency
        $this->app->singleton(\App\Services\EnhancedLiveTranscriptionService::class, function ($app) {
            return new \App\Services\EnhancedLiveTranscriptionService(
                $app->make(\App\Services\AzureWhisperService::class),
                $app->make(\App\Services\VoiceService::class),
                $app->make(\App\Services\MeetingService::class)
            );
        });

        // Other enhanced services (check if these exist before registering)
        if (class_exists(\App\Services\VoiceFingerprintService::class)) {
            $this->app->singleton(\App\Services\VoiceFingerprintService::class);
        }
        
        if (class_exists(\App\Services\AudioChunkingService::class)) {
            $this->app->singleton(\App\Services\AudioChunkingService::class);
        }
        
        // Mock Whisper service voor testing
        if (env('WHISPER_SERVICE_MOCK', false)) {
            $this->app->bind(\App\Services\AzureWhisperService::class, \App\Services\MockWhisperService::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Set default string length for database indexes
        Schema::defaultStringLength(191);
    }
}