<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use Inertia\Inertia;

class AssemblyController extends Controller
{
    public function index(): \Inertia\Response
    {
        // Fetch all assemblies from the database
        $assemblies = Assembly::withCount('mappings')
            ->withCount(['genomicAnnotations', 'buscoAnalyses', "repeatmaskerAnalyses", 'taxaminerAnalyses'])
            ->paginate(12);

        // Pass the data to the Inertia component
        return Inertia::render('Assemblies', [
            'assemblies' => $assemblies
        ]);
    }

    public function selection(): \Inertia\Response
    {
        // Fetch all assemblies from the database
        $assemblies = Assembly::all();

        // Pass the data to the Inertia component
        return Inertia::render('BrowserSelection', [
            'assemblies' => $assemblies
        ]);
    }

    public function show($id): \Inertia\Response
    {
        $assembly = Assembly::with(["mappings", "genomicAnnotations", "buscoAnalyses", "repeatmaskerAnalyses", "fcatAnalyses", 'taxaminerAnalyses'])->findOrFail($id);

        return Inertia::render('Assembly', [
            'assembly' => $assembly
        ]);
    }

    public function browser($id): \Inertia\Response
    {
        $assembly = Assembly::with(["mappings", "genomicAnnotations"])->findOrFail($id);

        return Inertia::render('GenomeBrowser', [
            'assembly' => $assembly
        ]);
    }


}
