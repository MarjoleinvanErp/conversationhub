<?php

return [
    // Azure Whisper Configuration
    'azure_whisper' => [
        'endpoint' => env('AZURE_WHISPER_ENDPOINT'),
        'key' => env('AZURE_WHISPER_KEY'),
        'region' => env('AZURE_WHISPER_REGION', 'westeurope'),
        'language' => env('AZURE_WHISPER_LANGUAGE', 'nl-NL'),
        'timeout' => env('AZURE_WHISPER_TIMEOUT', 30),
    ],

    // Privacy Settings
    'privacy' => [
        'enabled' => env('PRIVACY_FILTER_ENABLED', true),
        'filters' => [
            'bsn' => true,
            'phone' => true,
            'email' => true,
            'address' => true,
            'health_data' => true,
        ],
        'replacement_text' => '[PRIVACY_FILTERED]',
    ],

    // Data Retention
    'data_retention' => [
        'audio_files_days' => env('DATA_RETENTION_AUDIO_DAYS', 30),
        'transcripts_days' => env('DATA_RETENTION_TRANSCRIPTS_DAYS', 90),
        'exports_days' => env('DATA_RETENTION_EXPORTS_DAYS', 7),
        'auto_delete' => env('AUTO_DELETE_ENABLED', true),
    ],

    // N8N Integration
    'n8n' => [
        'webhook_url' => env('N8N_WEBHOOK_URL'),
        'api_key' => env('N8N_API_KEY'),
        'timeout' => env('N8N_TIMEOUT', 10),
        'enabled' => env('N8N_ENABLED', false),
    ],

    // Audio Processing
    'audio' => [
        'max_file_size' => env('AUDIO_MAX_FILE_SIZE', 50), // MB
        'allowed_formats' => ['wav', 'mp3', 'webm', 'm4a'],
        'chunk_duration' => env('AUDIO_CHUNK_DURATION', 30), // seconds
        'quality' => env('AUDIO_QUALITY', 'high'),
    ],

    // Meeting Settings
    'meeting' => [
        'max_duration' => env('MEETING_MAX_DURATION', 240), // minutes
        'max_participants' => env('MEETING_MAX_PARTICIPANTS', 20),
        'auto_save_interval' => env('MEETING_AUTO_SAVE_INTERVAL', 60), // seconds
    ],
];