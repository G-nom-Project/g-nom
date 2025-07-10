<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Inertia\Response;

class AssemblyController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $assemblies = Assembly::query()
            ->when($search, function ($query) use ($search) {
                if (is_numeric($search)) {
                    return $query->where('taxon_id', (int)$search);
                } else {
                    return $query->where('name', 'LIKE', '%' . $search . '%');
                }
            })
            ->withCount('mappings')
            ->withCount(['genomicAnnotations', 'buscoAnalyses', 'repeatmaskerAnalyses', 'taxaminerAnalyses'])
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Assemblies', [
            'assemblies' => $assemblies,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function selection(): Response
    {
        // Fetch all assemblies from the database
        $assemblies = Assembly::all();

        // Pass the data to the Inertia component
        return Inertia::render('BrowserSelection', [
            'assemblies' => $assemblies
        ]);
    }

    public function show($id): Response
    {
        $assembly = Assembly::with(["mappings", "genomicAnnotations", "buscoAnalyses", "repeatmaskerAnalyses", "fcatAnalyses", 'taxaminerAnalyses', "taxon"])->findOrFail($id);

        return Inertia::render('Assembly', [
            'assembly' => $assembly
        ]);
    }

    public function browser($id): Response
    {
        $assembly = Assembly::with(["mappings", "genomicAnnotations"])->findOrFail($id);

        return Inertia::render('GenomeBrowser', [
            'assembly' => $assembly
        ]);
    }


}
