<?php

namespace App\Http\Middleware;

use App\Services\ApplicationModeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GnomPublicInstance
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!config('gnom.public', false)) {
            abort(503, 'This G-nom instance is non-public.');
        }

        return $next($request);
    }
}
