<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExportController extends Controller
{
    /**
     * Export meeting data
     */
    public function export(Request $request, $meetingId): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Export functionality not implemented yet'
        ], 501);
    }

    /**
     * Download export file
     */
    public function download(Request $request, $exportId): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Download functionality not implemented yet'
        ], 501);
    }
}