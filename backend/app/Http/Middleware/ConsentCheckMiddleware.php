<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConsentCheckMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip consent check for certain routes
        $excludedRoutes = [
            'api/auth/*',
            'api/health',
            'api/privacy/consent',
        ];

        foreach ($excludedRoutes as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        // Check if user has given consent for data processing
        if ($request->user() && !$request->user()->hasGivenConsent()) {
            return response()->json([
                'success' => false,
                'message' => 'Data processing consent required',
                'consent_required' => true,
            ], 403);
        }

        return $next($request);
    }
}