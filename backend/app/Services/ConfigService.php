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
            'live_webspeech_enabled' => env('TRANSCRIPTION_LIVE_WEBSPEECH_ENABLED', true),
            'whisper_enabled' => env('TRANSCRIPTION_WHISPER_ENABLED', true),
            'whisper_chunk_duration' => (int) env('TRANSCRIPTION_WHISPER_CHUNK_DURATION', 90),
        ];
    }

    /**
     * Get N8N configuration
     */
    public static function getN8NConfig(): array
    {
        return [
            'auto_export_enabled' => env('N8N_AUTO_EXPORT_ENABLED', false),
            'auto_export_interval_minutes' => (int) env('N8N_AUTO_EXPORT_INTERVAL_MINUTES', 10),
            'webhook_url' => env('N8N_WEBHOOK_URL'),
            'api_key' => env('N8N_API_KEY'),
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
            'privacy' => [
                'filter_enabled' => env('PRIVACY_FILTER_ENABLED', true),
                'data_retention_days' => (int) env('DATA_RETENTION_DAYS', 90),
                'auto_delete_audio' => env('AUTO_DELETE_AUDIO', true),
            ],
            'azure' => [
                'whisper_configured' => !empty(env('AZURE_WHISPER_ENDPOINT')) && !empty(env('AZURE_WHISPER_KEY')),
            ],
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
     * Get N8N auto export interval in minutes
     */
    public static function getN8NAutoExportInterval(): int
    {
        return (int) env('N8N_AUTO_EXPORT_INTERVAL_MINUTES', 10);
    }
}