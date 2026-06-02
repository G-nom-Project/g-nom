<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SparqlController extends Controller
{
    //
    public function queryPage()
    {
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
