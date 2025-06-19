<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AgendaController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

/*
|--------------------------------------------------------------------------
| Public Routes (No Authentication Required)
|--------------------------------------------------------------------------
*/

// Health check endpoint
Route::get('/health', [\App\Http\Controllers\Api\HealthController::class, 'check']);

// Speech test endpoint (public for debugging)
Route::get('/speech/test', [\App\Http\Controllers\Api\SpeechController::class, 'test']);

// Public configuration endpoint (safe, non-sensitive data)
Route::get('/config/public', [\App\Http\Controllers\Api\ConfigController::class, 'publicConfig']);

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('/forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Authentication Required)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    
    /*
    |--------------------------------------------------------------------------
    | User & Authentication Routes
    |--------------------------------------------------------------------------
    */
    
    // Current user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Logout
    Route::post('/auth/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Configuration Routes (Authenticated)
    |--------------------------------------------------------------------------
    */
    
    // Full configuration (with sensitive data)
    Route::get('/config', [\App\Http\Controllers\Api\ConfigController::class, 'index']);
    Route::get('/config/transcription', [\App\Http\Controllers\Api\ConfigController::class, 'transcription']);
    Route::get('/config/n8n', [\App\Http\Controllers\Api\ConfigController::class, 'n8n']);

    /*
    |--------------------------------------------------------------------------
    | Meeting Routes
    |--------------------------------------------------------------------------
    */
    
    // Meeting CRUD
    Route::apiResource('meetings', \App\Http\Controllers\Api\MeetingController::class);
    
    // Meeting actions
    Route::post('/meetings/{meeting}/start', [\App\Http\Controllers\Api\MeetingController::class, 'start']);
    Route::post('/meetings/{meeting}/stop', [\App\Http\Controllers\Api\MeetingController::class, 'stop']);

    /*
    |--------------------------------------------------------------------------
    | Participant Routes
    |--------------------------------------------------------------------------
    */
    
    // Participants (nested under meetings)
    Route::apiResource('meetings.participants', \App\Http\Controllers\Api\ParticipantController::class);

    /*
    |--------------------------------------------------------------------------
    | Audio Processing Routes (Rate Limited)
    |--------------------------------------------------------------------------
    */
    
    Route::middleware('throttle:audio')->group(function () {
        Route::post('/audio/upload', [\App\Http\Controllers\Api\AudioController::class, 'upload']);
        Route::get('/audio/list', [\App\Http\Controllers\Api\AudioController::class, 'list']);
        Route::delete('/audio/{filename}', [\App\Http\Controllers\Api\AudioController::class, 'delete']);
    });

    /*
    |--------------------------------------------------------------------------
    | Speech Processing Routes (Rate Limited)
    |--------------------------------------------------------------------------
    */
    
    Route::middleware('throttle:speech')->group(function () {
        Route::post('/speech/transcribe', [\App\Http\Controllers\Api\SpeechController::class, 'transcribe']);
    });

    /*
    |--------------------------------------------------------------------------
    | Enhanced Live Transcription Routes (Rate Limited)
    |--------------------------------------------------------------------------
    */
    
    Route::middleware('throttle:speech')->group(function () {
        Route::post('/live-transcription/enhanced/start', [\App\Http\Controllers\Api\LiveTranscriptionController::class, 'startEnhancedSession']);
        Route::post('/live-transcription/setup-voice', [\App\Http\Controllers\Api\LiveTranscriptionController::class, 'setupVoiceProfile']);
        Route::post('/live-transcription/process-live', [\App\Http\Controllers\Api\LiveTranscriptionController::class, 'processLive']);
        Route::post('/live-transcription/verify-whisper', [\App\Http\Controllers\Api\LiveTranscriptionController::class, 'verifyWithWhisper']);
    });

    /*
    |--------------------------------------------------------------------------
    | Transcription Routes
    |--------------------------------------------------------------------------
    */
    
    // Get transcriptions for a meeting
    Route::get('/meetings/{meeting}/transcriptions', [\App\Http\Controllers\Api\TranscriptionController::class, 'index']);
    
    // Whisper transcriptions (specific endpoint)
    Route::get('/meetings/{meeting}/whisper-transcriptions', [\App\Http\Controllers\Api\TranscriptionController::class, 'getWhisperTranscriptions']);
    
    // Transcription CRUD
    Route::post('/transcriptions', [\App\Http\Controllers\Api\TranscriptionController::class, 'store']);
    Route::get('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'show']);
    Route::put('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'update']);
    Route::delete('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'destroy']);

    // Delete transcriptions by type or meeting
    Route::delete('/meetings/{meeting}/transcriptions/{type?}', [\App\Http\Controllers\Api\TranscriptionController::class, 'deleteTranscriptions']);
    Route::delete('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'deleteTranscription']);

    /*
    |--------------------------------------------------------------------------
    | Agenda Routes
    |--------------------------------------------------------------------------
    */
    
    Route::get('/meetings/{meetingId}/agenda', [AgendaController::class, 'index']);
    Route::post('/meetings/{meetingId}/agenda', [AgendaController::class, 'store']);
    Route::put('/meetings/{meetingId}/agenda/{agendaItemId}/status', [AgendaController::class, 'updateStatus']);
    Route::delete('/meetings/{meetingId}/agenda/{agendaItemId}', [AgendaController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Export Routes
    |--------------------------------------------------------------------------
    */
    
    Route::post('/meetings/{meeting}/export', [\App\Http\Controllers\Api\ExportController::class, 'export']);
    Route::get('/exports/{export}/download', [\App\Http\Controllers\Api\ExportController::class, 'download']);

    /*
    |--------------------------------------------------------------------------
    | Privacy Routes
    |--------------------------------------------------------------------------
    */
    
    Route::get('/privacy/settings', [\App\Http\Controllers\Api\PrivacyController::class, 'settings']);
    Route::post('/privacy/consent', [\App\Http\Controllers\Api\PrivacyController::class, 'consent']);
});