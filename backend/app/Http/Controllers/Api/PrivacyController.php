<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PrivacyController extends Controller
{
    /**
     * Get privacy settings
     */
    public function settings(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'privacy_level' => 'standard',
                'data_retention_days' => 90,
                'auto_delete_enabled' => true
            ]
        ]);
    }

    /**
     * Update privacy consent
     */
    public function consent(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Privacy consent updated'
        ]);
    }
}