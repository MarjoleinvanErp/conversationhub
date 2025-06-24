<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\ReportController;

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
| N8N Routes (GEEN AUTHENTICATIE - Public voor N8N toegang)
|--------------------------------------------------------------------------
*/

// N8N Data Endpoints - Voor N8N om meeting data op te halen
Route::prefix('n8n-data')->group(function () {
    // Health check specifically for N8N
    Route::get('/health', [\App\Http\Controllers\Api\N8NDataController::class, 'health']);
    
    // Meeting basis info
    Route::get('/meeting/{meetingId}', [\App\Http\Controllers\Api\N8NDataController::class, 'getMeeting']);
    
    // Meeting componenten
    Route::get('/meeting/{meetingId}/participants', [\App\Http\Controllers\Api\N8NDataController::class, 'getParticipants']);
    Route::get('/meeting/{meetingId}/agenda', [\App\Http\Controllers\Api\N8NDataController::class, 'getAgenda']);
    Route::get('/meeting/{meetingId}/transcriptions', [\App\Http\Controllers\Api\N8NDataController::class, 'getTranscriptions']);
    Route::get('/meeting/{meetingId}/privacy', [\App\Http\Controllers\Api\N8NDataController::class, 'getPrivacyData']);
    
    // Complete meeting package (alle data in één call)
    Route::get('/meeting/{meetingId}/complete', [\App\Http\Controllers\Api\N8NDataController::class, 'getCompleteMeeting']);
});

// N8N Trigger Endpoints - Voor ConversationHub om N8N te triggeren
Route::prefix('n8n')->group(function () {
    // Trigger N8N workflows met alleen meeting ID
    Route::post('/trigger-meeting/{meetingId}', [App\Http\Controllers\Api\N8NController::class, 'triggerMeeting']);
    Route::post('/trigger-meeting-completed/{meetingId}', [App\Http\Controllers\Api\N8NController::class, 'triggerMeetingCompleted']);
    Route::post('/trigger-meeting-started/{meetingId}', [App\Http\Controllers\Api\N8NController::class, 'triggerMeetingStarted']);
    
    // Test triggers
    Route::post('/test-trigger', [App\Http\Controllers\Api\N8NController::class, 'testTrigger']);
    
    // Connection testing
    Route::get('/status', [App\Http\Controllers\Api\N8NController::class, 'status']);
    Route::post('/test-connection', [App\Http\Controllers\Api\N8NController::class, 'testConnection']);

   // Gespreksverslag opslaan
    Route::post('/save-report/{meetingId}', [App\Http\Controllers\Api\N8NController::class, 'saveReport']);
});

// N8N Webhook Endpoints - Voor N8N om data terug te sturen
Route::prefix('webhook/n8n')->group(function () {
    Route::get('/health', [App\Http\Controllers\Api\N8NWebhookController::class, 'health']);
    Route::post('/report-completed', [App\Http\Controllers\Api\N8NWebhookController::class, 'reportCompleted']);
    Route::post('/export-completed', [App\Http\Controllers\Api\N8NWebhookController::class, 'exportCompleted']);
    Route::post('/custom', [App\Http\Controllers\Api\N8NWebhookController::class, 'customWebhook']);
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
| Report Routes (N8N writes via SQL, API reads/edits only)
|--------------------------------------------------------------------------
*/

Route::prefix('meetings/{meeting}/reports')->group(function () {
    // Read operations (voor meetingroom pagina)
    Route::get('/', [ReportController::class, 'index']);
    Route::get('/stats', [ReportController::class, 'getReportStats']);
    Route::get('/{report}', [ReportController::class, 'show']);
    
    // User editing operations (sectie-per-sectie bewerking)
    Route::put('/{report}/sections/{section}', [ReportController::class, 'updateSection']);
    Route::post('/{report}/privacy-toggle', [ReportController::class, 'togglePrivacyFiltering']);
    
    // Export operations
    Route::get('/{report}/export/html', [ReportController::class, 'exportHtml']);
});








    /*
    |--------------------------------------------------------------------------
    | Privacy Routes
    |--------------------------------------------------------------------------
    */
    
    Route::get('/privacy/settings', [\App\Http\Controllers\Api\PrivacyController::class, 'settings']);
    Route::post('/privacy/consent', [\App\Http\Controllers\Api\PrivacyController::class, 'consent']);
});