<?php

return [
    // Azure Whisper Configuration - gebruikmakend van jouw .env variabelen
    'azure_whisper' => [
        'endpoint' => env('AZURE_WHISPER_ENDPOINT'),
        'key' => env('AZURE_WHISPER_KEY'),
        'model' => env('AZURE_WHISPER_MODEL', 'Whisper'),
        'region' => env('AZURE_WHISPER_REGION', 'westeurope'),
        'language' => env('AZURE_WHISPER_LANGUAGE', 'nl'),
        'timeout' => env('AZURE_WHISPER_TIMEOUT', 30),
        'api_version' => '2024-06-01', // Fixed version voor Azure OpenAI
        'response_format' => 'verbose_json',
        'temperature' => 0,
        'max_retries' => 3,
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
            'names' => env('PRIVACY_FILTER_NAMES', false),
            'dates' => env('PRIVACY_FILTER_DATES', false),
            'financial' => env('PRIVACY_FILTER_FINANCIAL', true),
        ],
        'replacement_text' => '[PRIVACY_FILTERED]',
        'confidence_threshold' => env('PRIVACY_CONFIDENCE_THRESHOLD', 0.8),
        'auto_apply' => env('PRIVACY_AUTO_APPLY', true),
        'log_filtered_content' => env('PRIVACY_LOG_FILTERED', false),
    ],

    // Data Retention
    'data_retention' => [
        'audio_files_days' => env('DATA_RETENTION_AUDIO_DAYS', 30),
        'transcripts_days' => env('DATA_RETENTION_TRANSCRIPTS_DAYS', 90),
        'exports_days' => env('DATA_RETENTION_EXPORTS_DAYS', 7),
        'auto_delete' => env('AUTO_DELETE_ENABLED', true),
        'backup_before_delete' => env('BACKUP_BEFORE_DELETE', true),
        'retention_check_frequency' => env('RETENTION_CHECK_FREQUENCY', 'daily'),
        'permanent_delete_after_days' => env('PERMANENT_DELETE_AFTER_DAYS', 365),
    ],

    // Audio Processing
    'audio' => [
        'max_file_size' => env('AUDIO_MAX_FILE_SIZE', 25), // MB
        'allowed_formats' => ['wav', 'mp3', 'webm', 'm4a', 'ogg', 'flac'],
        'chunk_duration' => env('AUDIO_CHUNK_DURATION', 30),
        'quality' => env('AUDIO_QUALITY', 'high'),
        'sample_rate' => env('AUDIO_SAMPLE_RATE', 44100),
        'channels' => env('AUDIO_CHANNELS', 1),
        'compression' => env('AUDIO_COMPRESSION', true),
        'noise_reduction' => env('AUDIO_NOISE_REDUCTION', true),
        'echo_cancellation' => env('AUDIO_ECHO_CANCELLATION', true),
        'auto_gain_control' => env('AUDIO_AUTO_GAIN_CONTROL', true),
        'silence_detection' => env('AUDIO_SILENCE_DETECTION', true),
        'min_confidence_threshold' => env('AUDIO_MIN_CONFIDENCE', 0.6),
    ],

    // Live Transcription Settings
    'live_transcription' => [
        'enabled' => env('LIVE_TRANSCRIPTION_ENABLED', true),
        'chunk_duration' => env('LIVE_TRANSCRIPTION_CHUNK_DURATION', 30),
        'max_session_duration' => env('LIVE_TRANSCRIPTION_MAX_SESSION', 7200),
        'auto_save_chunks' => env('LIVE_TRANSCRIPTION_AUTO_SAVE', true),
        'combine_live_and_whisper' => env('LIVE_TRANSCRIPTION_COMBINE', true),
        'cost_limit_per_session' => env('LIVE_TRANSCRIPTION_COST_LIMIT', 5.00),
    ],

    // Voice Recognition Settings
    'voice_recognition' => [
        'enabled' => env('VOICE_RECOGNITION_ENABLED', true),
        'confidence_threshold' => env('VOICE_CONFIDENCE_THRESHOLD', 0.7),
        'learning_enabled' => env('VOICE_LEARNING_ENABLED', true),
        'fallback_to_manual' => env('VOICE_FALLBACK_MANUAL', true),
    ],
];