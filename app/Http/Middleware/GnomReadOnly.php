<?php

namespace App\Http\Middleware;

use App\Services\ApplicationModeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GnomReadOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app(ApplicationModeService::class)->isReadOnly()) {
            abort(503, 'This G-nom instance is currently read-only.');
        }

        return $next($request);
    }
}
