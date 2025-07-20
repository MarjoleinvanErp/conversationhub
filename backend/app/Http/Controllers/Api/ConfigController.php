<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ConfigService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ConfigController extends Controller
{
    /**
     * Get all configuration for frontend
     */
    public function getConfig(): JsonResponse
    {
        try {
            $config = ConfigService::getAllConfig();
            
            return response()->json([
                'success' => true,
                'data' => $config
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get configuration', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get configuration'
            ], 500);
        }
    }

    /**
     * Update configuration (if needed for admin interface)
     */
    public function updateConfig(Request $request): JsonResponse
    {
        try {
            // For now, configuration is environment-based
            // This could be extended for database-stored config
            
            return response()->json([
                'success' => false,
                'error' => 'Configuration updates not implemented - use environment variables'
            ], 501);

        } catch (\Exception $e) {
            Log::error('Failed to update configuration', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to update configuration'
            ], 500);
        }
    }
}