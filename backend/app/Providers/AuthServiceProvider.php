<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     */
    protected $policies = [
        \App\Models\Meeting::class => \App\Policies\MeetingPolicy::class,
        \App\Models\Participant::class => \App\Policies\ParticipantPolicy::class,
        \App\Models\Export::class => \App\Policies\ExportPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define custom gates for ConversationHub
        Gate::define('manage-privacy-settings', function ($user) {
            return $user->hasRole('admin') || $user->hasRole('privacy_officer');
        });

        Gate::define('access-audit-logs', function ($user) {
            return $user->hasRole('admin') || $user->hasRole('auditor');
        });

        Gate::define('export-data', function ($user) {
            return $user->hasPermission('export_data');
        });
    }
}