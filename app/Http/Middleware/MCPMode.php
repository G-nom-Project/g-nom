<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MCPMode
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('gnom.mcp_enabled', 'false')) {
            abort(503, 'MCP Servers are disabled on this G-nom instance.');
        }

        return $next($request);
    }
}
