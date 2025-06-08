<?php

return [
    // Azure Whisper Configuration
    'azure_whisper' => [
        'endpoint' => env('AZURE_WHISPER_ENDPOINT'),
        'key' => env('AZURE_WHISPER_KEY'),
        'region' => env('AZURE_WHISPER_REGION', 'westeurope'),
        'model' => env('AZURE_WHISPER_MODEL', 'Whisper'),
        'language' => env('AZURE_WHISPER_LANGUAGE', 'nl-NL'),
        'timeout' => env('AZURE_WHISPER_TIMEOUT', 30),
        'api_version' => env('AZURE_WHISPER_API_VERSION', '2024-02-01'),
        'response_format' => env('AZURE_WHISPER_RESPONSE_FORMAT', 'verbose_json'),
        'temperature' => env('AZURE_WHISPER_TEMPERATURE', 0),
        'timestamp_granularities' => ['word', 'segment'],
    ],

    // Azure Speech Service Configuration
    'azure_speech' => [
        'key' => env('AZURE_SPEECH_KEY'),
        'region' => env('AZURE_SPEECH_REGION', 'westeurope'),
        'endpoint' => env('AZURE_SPEECH_ENDPOINT'),
        'language' => env('AZURE_SPEECH_LANGUAGE', 'nl-NL'),
        'timeout' => env('AZURE_SPEECH_TIMEOUT', 30),
        'sample_rate' => env('AZURE_SPEECH_SAMPLE_RATE', 16000),
        'format' => env('AZURE_SPEECH_FORMAT', 'detailed'),
        'profanity_filter' => env('AZURE_SPEECH_PROFANITY_FILTER', 'Masked'),
        'continuous_recognition' => env('AZURE_SPEECH_CONTINUOUS', true),
        'interim_results' => env('AZURE_SPEECH_INTERIM_RESULTS', true),
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

    // N8N Integration
    'n8n' => [
        'webhook_url' => env('N8N_WEBHOOK_URL'),
        'api_key' => env('N8N_API_KEY'),
        'timeout' => env('N8N_TIMEOUT', 10),
        'enabled' => env('N8N_ENABLED', false),
        'retry_attempts' => env('N8N_RETRY_ATTEMPTS', 3),
        'retry_delay' => env('N8N_RETRY_DELAY', 5),
        'include_audio' => env('N8N_INCLUDE_AUDIO', false),
        'include_participants' => env('N8N_INCLUDE_PARTICIPANTS', true),
        'include_agenda' => env('N8N_INCLUDE_AGENDA', true),
    ],

    // Audio Processing
    'audio' => [
        'max_file_size' => env('AUDIO_MAX_FILE_SIZE', 50),
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

    // Meeting Settings
    'meeting' => [
        'max_duration' => env('MEETING_MAX_DURATION', 240),
        'max_participants' => env('MEETING_MAX_PARTICIPANTS', 20),
        'auto_save_interval' => env('MEETING_AUTO_SAVE_INTERVAL', 60),
        'default_privacy_level' => env('MEETING_DEFAULT_PRIVACY_LEVEL', 'standard'),
        'auto_transcription_default' => env('MEETING_AUTO_TRANSCRIPTION_DEFAULT', true),
        'agenda_reminder_interval' => env('MEETING_AGENDA_REMINDER_INTERVAL', 900),
        'inactivity_timeout' => env('MEETING_INACTIVITY_TIMEOUT', 1800),
        'auto_end_on_inactivity' => env('MEETING_AUTO_END_INACTIVITY', false),
        'recording_quality' => env('MEETING_RECORDING_QUALITY', 'high'),
        'speaker_identification' => env('MEETING_SPEAKER_IDENTIFICATION', true),
        'real_time_transcription' => env('MEETING_REAL_TIME_TRANSCRIPTION', true),
    ],

    // Transcription Settings
    'transcription' => [
        'provider' => env('TRANSCRIPTION_PROVIDER', 'azure_speech'),
        'fallback_provider' => env('TRANSCRIPTION_FALLBACK_PROVIDER', 'web_speech'),
        'min_confidence' => env('TRANSCRIPTION_MIN_CONFIDENCE', 0.7),
        'max_retries' => env('TRANSCRIPTION_MAX_RETRIES', 2),
        'chunk_overlap' => env('TRANSCRIPTION_CHUNK_OVERLAP', 2),
        'punctuation' => env('TRANSCRIPTION_PUNCTUATION', true),
        'capitalization' => env('TRANSCRIPTION_CAPITALIZATION', true),
        'profanity_filter' => env('TRANSCRIPTION_PROFANITY_FILTER', true),
        'speaker_diarization' => env('TRANSCRIPTION_SPEAKER_DIARIZATION', true),
        'language_detection' => env('TRANSCRIPTION_LANGUAGE_DETECTION', false),
        'custom_vocabulary' => env('TRANSCRIPTION_CUSTOM_VOCABULARY', []),
    ],

    // Export Settings
    'export' => [
        'default_format' => env('EXPORT_DEFAULT_FORMAT', 'pdf'),
        'available_formats' => ['pdf', 'docx', 'txt', 'json', 'xml'],
        'include_timestamps' => env('EXPORT_INCLUDE_TIMESTAMPS', true),
        'include_speaker_labels' => env('EXPORT_INCLUDE_SPEAKER_LABELS', true),
        'include_confidence_scores' => env('EXPORT_INCLUDE_CONFIDENCE_SCORES', false),
        'include_agenda_tracking' => env('EXPORT_INCLUDE_AGENDA_TRACKING', true),
        'include_participant_info' => env('EXPORT_INCLUDE_PARTICIPANT_INFO', true),
        'apply_privacy_filters' => env('EXPORT_APPLY_PRIVACY_FILTERS', true),
        'watermark' => env('EXPORT_WATERMARK', true),
        'max_export_size' => env('EXPORT_MAX_SIZE', 100),
        'compression' => env('EXPORT_COMPRESSION', true),
    ],

    // Analytics Settings
    'analytics' => [
        'enabled' => env('ANALYTICS_ENABLED', true),
        'track_usage' => env('ANALYTICS_TRACK_USAGE', true),
        'track_performance' => env('ANALYTICS_TRACK_PERFORMANCE', true),
        'track_errors' => env('ANALYTICS_TRACK_ERRORS', true),
        'anonymize_data' => env('ANALYTICS_ANONYMIZE_DATA', true),
        'retention_days' => env('ANALYTICS_RETENTION_DAYS', 90),
        'real_time_dashboard' => env('ANALYTICS_REAL_TIME_DASHBOARD', false),
    ],

    // Security Settings
    'security' => [
        'encryption_enabled' => env('SECURITY_ENCRYPTION_ENABLED', true),
        'encryption_algorithm' => env('SECURITY_ENCRYPTION_ALGORITHM', 'AES-256-CBC'),
        'api_rate_limit' => env('SECURITY_API_RATE_LIMIT', 60),
        'audio_rate_limit' => env('SECURITY_AUDIO_RATE_LIMIT', 10),
        'speech_rate_limit' => env('SECURITY_SPEECH_RATE_LIMIT', 20),
        'max_concurrent_sessions' => env('SECURITY_MAX_CONCURRENT_SESSIONS', 5),
        'session_timeout' => env('SECURITY_SESSION_TIMEOUT', 3600),
        'audit_logging' => env('SECURITY_AUDIT_LOGGING', true),
        'ip_whitelist' => env('SECURITY_IP_WHITELIST', null),
        'require_2fa' => env('SECURITY_REQUIRE_2FA', false),
    ],

    // Performance Settings
    'performance' => [
        'cache_enabled' => env('PERFORMANCE_CACHE_ENABLED', true),
        'cache_ttl' => env('PERFORMANCE_CACHE_TTL', 3600),
        'queue_enabled' => env('PERFORMANCE_QUEUE_ENABLED', true),
        'async_processing' => env('PERFORMANCE_ASYNC_PROCESSING', true),
        'batch_processing' => env('PERFORMANCE_BATCH_PROCESSING', true),
        'batch_size' => env('PERFORMANCE_BATCH_SIZE', 10),
        'memory_limit' => env('PERFORMANCE_MEMORY_LIMIT', '512M'),
        'max_execution_time' => env('PERFORMANCE_MAX_EXECUTION_TIME', 300),
        'database_connections' => env('PERFORMANCE_DB_CONNECTIONS', 10),
    ],

    // Notification Settings
    'notifications' => [
        'enabled' => env('NOTIFICATIONS_ENABLED', true),
        'email_notifications' => env('NOTIFICATIONS_EMAIL', true),
        'sms_notifications' => env('NOTIFICATIONS_SMS', false),
        'push_notifications' => env('NOTIFICATIONS_PUSH', false),
        'meeting_reminders' => env('NOTIFICATIONS_MEETING_REMINDERS', true),
        'transcription_complete' => env('NOTIFICATIONS_TRANSCRIPTION_COMPLETE', true),
        'export_ready' => env('NOTIFICATIONS_EXPORT_READY', true),
        'privacy_alerts' => env('NOTIFICATIONS_PRIVACY_ALERTS', true),
        'system_maintenance' => env('NOTIFICATIONS_SYSTEM_MAINTENANCE', true),
    ],

    // Webhook Settings
    'webhooks' => [
        'enabled' => env('WEBHOOKS_ENABLED', false),
        'meeting_started' => env('WEBHOOK_MEETING_STARTED', null),
        'meeting_ended' => env('WEBHOOK_MEETING_ENDED', null),
        'transcription_complete' => env('WEBHOOK_TRANSCRIPTION_COMPLETE', null),
        'export_ready' => env('WEBHOOK_EXPORT_READY', null),
        'privacy_violation' => env('WEBHOOK_PRIVACY_VIOLATION', null),
        'timeout' => env('WEBHOOK_TIMEOUT', 10),
        'retry_attempts' => env('WEBHOOK_RETRY_ATTEMPTS', 3),
        'verify_ssl' => env('WEBHOOK_VERIFY_SSL', true),
    ],

    // Live Transcription Settings (ADD THESE NEW SECTIONS)
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