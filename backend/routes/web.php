<?php

use Illuminate\Support\Facades\Route;

// Ultra simpele test route
Route::get('/test', function () {
    return 'Laravel Basic Test Works!';
});

// JSON test route
Route::get('/json-test', function () {
    return [
        'status' => 'success',
        'message' => 'JSON response works',
        'timestamp' => date('Y-m-d H:i:s')
    ];
});

// Debug route
Route::get('/debug', function () {
    return [
        'app_key' => config('app.key') ? 'Set' : 'Missing',
        'app_env' => config('app.env'),
        'php_version' => PHP_VERSION,
        'laravel_version' => app()->version(),
    ];
});

// Root route
Route::get('/', function () {
    return 'ConversationHub Backend is running!';
});