<?php

namespace App\Services;

class ConfigService
{
    /**
     * Get transcription configuration
     */
    public static function getTranscriptionConfig(): array
    {
        return [
            'live_webspeech_enabled' => filter_var(env('TRANSCRIPTION_LIVE_WEBSPEECH_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
            'whisper_enabled' => filter_var(env('TRANSCRIPTION_WHISPER_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
            'whisper_chunk_duration' => (int) env('TRANSCRIPTION_WHISPER_CHUNK_DURATION', 90),
            'n8n_transcription_enabled' => filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
            'default_transcription_service' => env('DEFAULT_TRANSCRIPTION_SERVICE', 'auto'), // auto, whisper, n8n
            'available_services' => [
                'whisper' => filter_var(env('TRANSCRIPTION_WHISPER_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
                'n8n' => filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN)
            ],
            'n8n_enabled' => filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
            'n8n_webhook_configured' => !empty(env('N8N_TRANSCRIPTION_WEBHOOK_URL'))
        ];
    }

    /**
     * Get N8N configuration
     */
    public static function getN8NConfig(): array
    {
        return [
            'enabled' => !empty(env('N8N_URL')),
            'url' => env('N8N_URL'),
            'webhook_base_url' => env('N8N_WEBHOOK_BASE_URL'),
            'webhook_url' => env('N8N_WEBHOOK_URL'),
            'api_key' => env('N8N_API_KEY'),
            'timeout_seconds' => (int) env('N8N_TIMEOUT_SECONDS', 60),
            
            // Transcription settings
            'transcription_enabled' => filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
            'transcription_webhook_url' => env('N8N_TRANSCRIPTION_WEBHOOK_URL'),
            
            // Auto export settings
            'auto_export_enabled' => filter_var(env('N8N_AUTO_EXPORT_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
            'auto_export_interval_minutes' => (int) env('N8N_AUTO_EXPORT_INTERVAL_MINUTES', 10),
        ];
    }

    /**
     * Get Azure configuration
     */
    public static function getAzureConfig(): array
    {
        return [
            'whisper_configured' => !empty(env('AZURE_WHISPER_ENDPOINT')) && !empty(env('AZURE_WHISPER_KEY')),
            'whisper_endpoint' => env('AZURE_WHISPER_ENDPOINT'),
            'whisper_region' => env('AZURE_WHISPER_REGION', 'westeurope'),
            'whisper_model' => env('AZURE_WHISPER_MODEL', 'Whisper'),
            'whisper_language' => env('AZURE_WHISPER_LANGUAGE', 'nl'),
            
            'speech_configured' => !empty(env('AZURE_SPEECH_KEY')),
            'speech_key' => env('AZURE_SPEECH_KEY'),
            'speech_region' => env('AZURE_SPEECH_REGION', 'westeurope'),
            'speech_language' => env('AZURE_SPEECH_LANGUAGE', 'nl-NL'),
            'speech_endpoint' => env('AZURE_SPEECH_ENDPOINT'),
            'speech_diarization_enabled' => filter_var(env('AZURE_SPEECH_ENABLE_DIARIZATION', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    /**
     * Get privacy configuration
     */
    public static function getPrivacyConfig(): array
    {
        return [
            'filter_enabled' => filter_var(env('PRIVACY_FILTER_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
            'data_retention_days' => (int) env('DATA_RETENTION_DAYS', 90),
            'auto_delete_audio' => filter_var(env('AUTO_DELETE_AUDIO', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    /**
     * Get performance configuration
     */
    public static function getPerformanceConfig(): array
    {
        return [
            'cache_compression' => filter_var(env('CACHE_COMPRESSION', true), FILTER_VALIDATE_BOOLEAN),
            'response_compression' => filter_var(env('RESPONSE_COMPRESSION', true), FILTER_VALIDATE_BOOLEAN),
            'cache_statistics' => filter_var(env('CACHE_STATISTICS', false), FILTER_VALIDATE_BOOLEAN),
            'db_timeout' => (int) env('DB_TIMEOUT', 10),
        ];
    }

    /**
     * Get all configuration for frontend
     */
    public static function getAllConfig(): array
    {
        return [
            'transcription' => self::getTranscriptionConfig(),
            'n8n' => self::getN8NConfig(),
            'azure' => self::getAzureConfig(),
            'privacy' => self::getPrivacyConfig(),
            'performance' => self::getPerformanceConfig(),
            'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
            'app' => [
                'name' => env('APP_NAME', 'ConversationHub'),
                'env' => env('APP_ENV', 'local'),
                'debug' => filter_var(env('APP_DEBUG', false), FILTER_VALIDATE_BOOLEAN),
                'url' => env('APP_URL', 'http://localhost'),
            ]
        ];
    }

    /**
     * Check if live transcription is enabled
     */
    public static function isLiveTranscriptionEnabled(): bool
    {
        return filter_var(env('TRANSCRIPTION_LIVE_WEBSPEECH_ENABLED', true), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Check if Whisper transcription is enabled
     */
    public static function isWhisperEnabled(): bool
    {
        return filter_var(env('TRANSCRIPTION_WHISPER_ENABLED', true), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get Whisper chunk duration in seconds
     */
    public static function getWhisperChunkDuration(): int
    {
        return (int) env('TRANSCRIPTION_WHISPER_CHUNK_DURATION', 90);
    }

    /**
     * Check if N8N auto export is enabled
     */
    public static function isN8NAutoExportEnabled(): bool
    {
        return filter_var(env('N8N_AUTO_EXPORT_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Check if N8N transcription is enabled
     */
    public static function isN8NTranscriptionEnabled(): bool
    {
        return filter_var(env('N8N_TRANSCRIPTION_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get N8N auto export interval in minutes
     */
    public static function getN8NAutoExportInterval(): int
    {
        return (int) env('N8N_AUTO_EXPORT_INTERVAL_MINUTES', 10);
    }

    /**
     * Get default transcription service
     */
    public static function getDefaultTranscriptionService(): string
    {
        return env('DEFAULT_TRANSCRIPTION_SERVICE', 'auto');
    }

    /**
     * Check if N8N is properly configured
     */
    public static function isN8NConfigured(): bool
    {
        return !empty(env('N8N_URL')) && !empty(env('N8N_WEBHOOK_URL'));
    }

    /**
     * Check if Azure Whisper is properly configured
     */
    public static function isAzureWhisperConfigured(): bool
    {
        return !empty(env('AZURE_WHISPER_ENDPOINT')) && !empty(env('AZURE_WHISPER_KEY'));
    }

    /**
     * Get service availability status
     */
    public static function getServiceAvailability(): array
    {
        return [
            'live_webspeech' => self::isLiveTranscriptionEnabled(),
            'whisper' => self::isWhisperEnabled() && self::isAzureWhisperConfigured(),
            'n8n' => self::isN8NTranscriptionEnabled() && self::isN8NConfigured(),
        ];
    }

    /**
     * Get recommended transcription service based on configuration
     */
    public static function getRecommendedTranscriptionService(): string
    {
        $availability = self::getServiceAvailability();
        $default = self::getDefaultTranscriptionService();

        // If auto, choose best available service
        if ($default === 'auto') {
            if ($availability['n8n']) {
                return 'n8n';
            } elseif ($availability['whisper']) {
                return 'whisper';
            } else {
                return 'live_webspeech';
            }
        }

        // Return default if it's available, otherwise fallback
        if (isset($availability[$default]) && $availability[$default]) {
            return $default;
        }

        // Fallback to any available service
        foreach (['n8n', 'whisper', 'live_webspeech'] as $service) {
            if ($availability[$service]) {
                return $service;
            }
        }

        return 'live_webspeech'; // Ultimate fallback
    }

    /**
     * Validate configuration completeness
     */
    public static function validateConfiguration(): array
    {
        $issues = [];
        $warnings = [];

        // Check required configurations
        if (empty(env('APP_KEY'))) {
            $issues[] = 'APP_KEY is not set. Run php artisan key:generate';
        }

        if (empty(env('DB_HOST')) || empty(env('DB_DATABASE'))) {
            $issues[] = 'Database configuration is incomplete';
        }

        // Check transcription services
        $availability = self::getServiceAvailability();
        if (!array_filter($availability)) {
            $warnings[] = 'No transcription services are properly configured';
        }

        // Check N8N configuration if enabled
        if (self::isN8NTranscriptionEnabled() && !self::isN8NConfigured()) {
            $warnings[] = 'N8N transcription is enabled but N8N is not properly configured';
        }

        // Check Whisper configuration if enabled
        if (self::isWhisperEnabled() && !self::isAzureWhisperConfigured()) {
            $warnings[] = 'Whisper transcription is enabled but Azure Whisper is not properly configured';
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'warnings' => $warnings,
            'service_availability' => $availability,
            'recommended_service' => self::getRecommendedTranscriptionService()
        ];
    }
}