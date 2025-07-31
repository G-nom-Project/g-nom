<?php

namespace App\Http\Controllers;

use App\Jobs\ImportAnnotation;
use App\Jobs\ImportAssembly;
use App\Jobs\ImportBusco;
use App\Jobs\ImportMapping;
use App\Models\Assembly;
use App\Models\Taxon;
use App\Notifications\UploadComplete;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Inertia\Response;

class AssemblyController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $assemblies = Assembly::query()
            ->visibleTo($request->user())
            ->when($search, function ($query) use ($search) {
                if (is_numeric($search)) {
                    return $query->where('taxon_id', (int)$search);
                } else {
                    return $query->where('name', 'LIKE', '%' . $search . '%');
                }
            })
            ->withCount('mappings')
            ->withCount(['genomicAnnotations', 'buscoAnalyses', 'repeatmaskerAnalyses', 'taxaminerAnalyses'])
            ->with('taxon.infos')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Assemblies', [
            'assemblies' => $assemblies,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function selection(Request $request): Response
    {
        // Fetch assemblies
        $assemblies = Assembly::query()->visibleTo($request->user())->get();

        // Pass the data to the Inertia component
        return Inertia::render('BrowserSelection', [
            'assemblies' => $assemblies
        ]);
    }

    /**
     * @param $id
     * @return Response
     * @throws AuthorizationException
     */
    public function show($id): Response
    {
        $assembly = Assembly::with(["mappings", "genomicAnnotations", "buscoAnalyses", "repeatmaskerAnalyses", "fcatAnalyses", 'taxaminerAnalyses', "taxon"])->findOrFail($id);
        $this->authorize('view', $assembly);
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

    /**
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * @throws AuthorizationException
     */
    public function uploadAssembly(Request $request)
    {
        $request->validate([
            'assembly' => 'required|file|mimes:gz,fa,txt,fasta,fna',
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // ensure taxon ID exists
            'name' => 'required|string|max:255',
        ]);

        // Enforce create policy
        $this->authorize('create', Assembly::class);
        // Store in upload directory
        $file = $request->file('assembly');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        // Handle files and database entry
        ImportAssembly::dispatch($path, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }


    /**
     * Annotations are always associated with an assembly and thus stored here.
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * @throws AuthorizationException
     */
    public function uploadAnnotation(Request $request)
    {
        $request->validate([
            'annotation' => 'required|file|mimetypes:text/plain,text/x-gff',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255'
        ]);

        // Enforce assembly policy an annotations
        $assemblyID = $request->input('assemblyID');
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('update', $assembly);

        // Store in upload directory
        $file = $request->file('annotation');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);

        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info("Dispatching Annotation Import Job now");
        // Handle files and database entry
        ImportAnnotation::dispatch($path, $assemblyID, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }

    public function uploadMapping(Request $request)
    {
        $request->validate([
            'mapping' => 'required|file',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255'
        ]);

        // Enforce assembly policy an mappings
        $assemblyID = $request->input('assemblyID');
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('update', $assembly);

        // Store in upload directory
        $file = $request->file('mapping');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info("Dispatching Mapping Import Job");
        // Handle files and database entry
        ImportMapping::dispatch($path, $originalExtension, $assemblyID, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }


    public function uploadBusco(Request $request)
    {
        $request->validate([
            'summary' => 'required|file',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255'
        ]);

        // Enforce assembly policy on BUSCO imports
        $assemblyID = $request->input('assemblyID');
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('update', $assembly);

        // Store in upload directory
        $file = $request->file('summary');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);
        $assemblyID = $request->input('assemblyID');
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info("Dispatching BUSCO Import Job");
        // Handle files and database entry
        ImportBusco::dispatch($path, $assemblyID, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }

    public function stats(Request $request)
    {
        $totalAssemblies = Cache::remember('totalAssemblies', 604800, function () use ($request) {
            return Assembly::count();
        });

        $taxaWithAssemblies = Cache::remember('taxaWithAssemblies', 604800, function () use ($request) {
            return Taxon::whereHas('assemblies')->count();
        });

        $rootUpdate = Taxon::where('ncbiTaxonID', 1)->first()->updated_at->format('d.m.Y');

        return Inertia::render('Welcome', [
            'totalAssemblies' => $totalAssemblies,
            'taxaWithAssemblies' => $taxaWithAssemblies,
            'rootUpdate' => $rootUpdate,
        ]);
    }
}
