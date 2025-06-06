<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

// Health check endpoint
Route::get('/health', [\App\Http\Controllers\Api\HealthController::class, 'check']);

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('/forgot-password', [\App\Http\Controllers\Api\AuthController::class, 'forgotPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/auth/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);

    // Meeting routes
    Route::apiResource('meetings', \App\Http\Controllers\Api\MeetingController::class);
    Route::post('/meetings/{meeting}/start', [\App\Http\Controllers\Api\MeetingController::class, 'start']);
    Route::post('/meetings/{meeting}/stop', [\App\Http\Controllers\Api\MeetingController::class, 'stop']);

    // Participant routes
    Route::apiResource('meetings.participants', \App\Http\Controllers\Api\ParticipantController::class);

// Audio processing routes
    Route::middleware('throttle:audio')->group(function () {
        Route::post('/audio/upload', [\App\Http\Controllers\Api\AudioController::class, 'upload']);
        Route::get('/audio/list', [\App\Http\Controllers\Api\AudioController::class, 'list']);
        Route::delete('/audio/{filename}', [\App\Http\Controllers\Api\AudioController::class, 'delete']);
    });

// Speech processing routes
    Route::middleware('throttle:speech')->group(function () {
        Route::post('/speech/transcribe', [\App\Http\Controllers\Api\SpeechController::class, 'transcribe']);
        Route::get('/speech/test', [\App\Http\Controllers\Api\SpeechController::class, 'test']); // Deze regel toevoegen
    });

// Transcription routes
    Route::get('/meetings/{meeting}/transcriptions', [\App\Http\Controllers\Api\TranscriptionController::class, 'index']);
    Route::post('/transcriptions', [\App\Http\Controllers\Api\TranscriptionController::class, 'store']);
    Route::get('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'show']);
    Route::put('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'update']);
    Route::delete('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'destroy']);


    // Export routes
    Route::post('/meetings/{meeting}/export', [\App\Http\Controllers\Api\ExportController::class, 'export']);
    Route::get('/exports/{export}/download', [\App\Http\Controllers\Api\ExportController::class, 'download']);

    // Privacy routes
    Route::get('/privacy/settings', [\App\Http\Controllers\Api\PrivacyController::class, 'settings']);
    Route::post('/privacy/consent', [\App\Http\Controllers\Api\PrivacyController::class, 'consent']);
});