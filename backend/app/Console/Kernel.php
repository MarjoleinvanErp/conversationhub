<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Clean up expired audio files daily
        $schedule->command('conversation:cleanup-audio')
                 ->daily()
                 ->at('02:00');

        // Process audio queue every minute
        $schedule->command('queue:work redis --sleep=3 --tries=3 --max-time=3600')
                 ->everyMinute()
                 ->withoutOverlapping();

        // Clean up expired meetings weekly
        $schedule->command('conversation:cleanup-meetings')
                 ->weekly()
                 ->sundays()
                 ->at('03:00');

        // Generate usage analytics daily
        $schedule->command('conversation:generate-analytics')
                 ->dailyAt('04:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}