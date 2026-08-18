<?php


namespace App\Http\Middleware;

use App\Services\ApplicationModeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AiMode
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!app(ApplicationModeService::class)->isAiEnabled()) {
            abort(503, 'This AI features are disabled on this G-nom instance.');
        }

        return $next($request);
    }
}
