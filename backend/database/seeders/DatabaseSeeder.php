<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Check if users already exist to avoid duplicates
        if (User::where('email', 'test@conversationhub.nl')->exists()) {
            $this->command->info('Test users already exist, skipping...');
            return;
        }

        // Create test admin user
        User::create([
            'name' => 'Test Admin',
            'email' => 'test@conversationhub.nl',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'privacy_consent' => true,
            'privacy_consent_at' => now(),
            'email_verified_at' => now(),
        ]);

        // Create demo user
        User::create([
            'name' => 'Demo User',
            'email' => 'demo@conversationhub.nl',
            'password' => Hash::make('demo123'),
            'role' => 'user',
            'privacy_consent' => true,
            'privacy_consent_at' => now(),
            'email_verified_at' => now(),
        ]);

        $this->command->info('Test users created successfully!');
        $this->command->info('Admin: test@conversationhub.nl / password123');
        $this->command->info('User: demo@conversationhub.nl / demo123');
    }
}