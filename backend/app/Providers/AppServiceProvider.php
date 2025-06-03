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
        // Register ConversationHub services
        $this->app->singleton(\App\Services\AudioProcessingService::class);
        $this->app->singleton(\App\Services\AzureWhisperService::class);
        $this->app->singleton(\App\Services\PrivacyFilterService::class);
        $this->app->singleton(\App\Services\N8nIntegrationService::class);
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