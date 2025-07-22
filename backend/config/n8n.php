<?php

return [
    /*
    |--------------------------------------------------------------------------
    | N8N Integration Configuration
    |--------------------------------------------------------------------------
    */

    'url' => env('N8N_URL', 'http://n8n:5678'),
    
    'webhook_base_url' => env('N8N_WEBHOOK_BASE_URL', 'http://n8n:5678/webhook'),
    
    'webhook_url' => env('N8N_WEBHOOK_URL', 'http://n8n:5678/webhook/conversationhub'),
    
    'api' => [
        'user' => env('N8N_API_USER', 'admin'),
        'password' => env('N8N_API_PASSWORD', 'conversationhub123'),
        'timeout' => env('N8N_TIMEOUT_SECONDS', 60),
    ],

    'transcription' => [
        'enabled' => env('N8N_TRANSCRIPTION_ENABLED', false),
        'webhook_url' => env('N8N_TRANSCRIPTION_WEBHOOK_URL'),
    ],

    'auto_export' => [
        'enabled' => env('N8N_AUTO_EXPORT_ENABLED', false),
        'interval_minutes' => env('N8N_AUTO_EXPORT_INTERVAL_MINUTES', 10),
    ],
];