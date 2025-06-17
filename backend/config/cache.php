<?php

return [
    // PERFORMANCE: Changed from 'file' to 'redis' voor betere performance
    'default' => env('CACHE_DRIVER', 'redis'),

    'stores' => [
        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'lock_connection' => 'default',
        ],
        
        // PERFORMANCE: Nieuwe gespecialiseerde cache stores
        'meetings' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'meetings:',
            'lock_connection' => 'default',
        ],

        'api_responses' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'api:',
            'lock_connection' => 'default',
        ],
    ],

    'prefix' => env('CACHE_PREFIX', 'conversationhub_cache'),
    
    // PERFORMANCE: Nieuwe cache configuratie opties
    'performance' => [
        'enable_compression' => env('CACHE_COMPRESSION', true),
        'compression_threshold' => 1024, // 1KB
        'default_ttl' => 3600, // 1 hour
        'enable_statistics' => env('CACHE_STATISTICS', false),
    ],
];