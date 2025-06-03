<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\PrivacyFilterService;
use Symfony\Component\HttpFoundation\Response;

class PrivacyFilterMiddleware
{
    protected $privacyFilter;

    public function __construct(PrivacyFilterService $privacyFilter)
    {
        $this->privacyFilter = $privacyFilter;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only filter JSON responses
        if ($response->headers->get('Content-Type') === 'application/json') {
            $content = $response->getContent();
            $data = json_decode($content, true);
            
            if ($data && config('conversation.privacy.enabled')) {
                $filteredData = $this->privacyFilter->filterData($data);
                $response->setContent(json_encode($filteredData));
            }
        }

        return $response;
    }
}