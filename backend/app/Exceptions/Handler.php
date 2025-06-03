<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e): Response
    {
        // Voor API routes, geef een simpele JSON response
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions with consistent JSON response format.
     */
    private function handleApiException(Request $request, Throwable $e): JsonResponse
    {
        // Bepaal status code
        $statusCode = 500;
        if (method_exists($e, 'getStatusCode')) {
            $statusCode = $e->getStatusCode();
        } elseif (method_exists($e, 'getCode') && $e->getCode() > 0) {
            $statusCode = $e->getCode();
        }

        // Zorg ervoor dat we een geldige HTTP status code hebben
        if ($statusCode < 100 || $statusCode > 599) {
            $statusCode = 500;
        }

        $response = [
            'success' => false,
            'message' => $e->getMessage() ?: 'Er is een fout opgetreden',
            'timestamp' => date('c'), // ISO 8601 format
        ];

        // Voeg debug info toe in development
        if (config('app.debug', false)) {
            $response['debug'] = [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ];
        }

        // Gebruik native PHP response creation om circulaire dependency te vermijden
        return new JsonResponse($response, $statusCode, [
            'Content-Type' => 'application/json',
        ]);
    }
}