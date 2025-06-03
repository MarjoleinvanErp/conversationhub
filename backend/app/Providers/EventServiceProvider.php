<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // ConversationHub Events
        \App\Events\MeetingStarted::class => [
            \App\Listeners\SendTranscriptionNotification::class,
            \App\Listeners\LogMeetingActivity::class,
        ],

        \App\Events\TranscriptionReceived::class => [
            \App\Listeners\UpdateAgendaProgress::class,
            \App\Listeners\SendTranscriptionNotification::class,
        ],

        \App\Events\ParticipantJoined::class => [
            \App\Listeners\LogMeetingActivity::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}