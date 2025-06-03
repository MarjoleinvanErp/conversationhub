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
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0',
    ]);
});

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
        Route::post('/audio/process', [\App\Http\Controllers\Api\AudioController::class, 'process']);
    });

    // Transcription routes
    Route::get('/meetings/{meeting}/transcriptions', [\App\Http\Controllers\Api\TranscriptionController::class, 'index']);
    Route::get('/transcriptions/{transcription}', [\App\Http\Controllers\Api\TranscriptionController::class, 'show']);

    // Export routes
    Route::post('/meetings/{meeting}/export', [\App\Http\Controllers\Api\ExportController::class, 'export']);
    Route::get('/exports/{export}/download', [\App\Http\Controllers\Api\ExportController::class, 'download']);

    // Privacy routes
    Route::get('/privacy/settings', [\App\Http\Controllers\Api\PrivacyController::class, 'settings']);
    Route::post('/privacy/consent', [\App\Http\Controllers\Api\PrivacyController::class, 'consent']);
});