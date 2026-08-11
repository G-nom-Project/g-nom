<?php

namespace App\Http\Controllers;

use App\Services\ApplicationModeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SparqlController extends Controller
{
    //
    public function queryPage()
    {
        if (!app(ApplicationModeService::class)->isSparqlConsoleEnabled()) {
            abort(503, 'SPARQL console is disabled on this instance');
        }

        $response = Http::timeout(120)
            ->get(config('gnom.qlever_host'), [
                'cmd' => 'stats',
            ]);

        return Inertia::render('SparqlPage', [
            'stats' => $response->json(),
        ]);
    }

    public function query(Request $request)
    {
        if (!app(ApplicationModeService::class)->isSparqlConsoleEnabled()) {
            abort(503, 'SPARQL console is disabled on this instance');
        }

        $validated = $request->validate([
            'query' => ['required', 'string'],
        ]);

        $response = Http::timeout(120)
            ->get(config('gnom.qlever_host'), [
                'query' => $request->input('query'),
            ]);

        return response()->json(
            $response->json(),
            $response->status()
        );
    }
}
