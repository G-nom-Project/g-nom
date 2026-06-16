<?php

namespace App\Http\Controllers;

use App\Jobs\Concerns\DispatchesTrackableJobs;
use App\Jobs\ImportAnnotation;
use App\Jobs\ImportMapping;
use App\Jobs\ImportRepeatmasker;
use App\Models\Assembly;
use App\Models\TaxaminerAnalysis;
use App\Models\TaxaminerDiamondRecord;
use App\Models\Taxon;
use App\Notifications\UploadComplete;
use App\Services\WikidataService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AssemblyController extends Controller
{
    use DispatchesTrackableJobs;

    public function index(Request $request, WikidataService $wikidata): Response
    {
        $search = request('search') ?? request('query');

        $assemblies = Assembly::query()
            ->visibleTo($request->user())
            ->when($search, function ($query) use ($search) {
                if (is_numeric($search)) {
                    return $query->where('taxon_ncbiTaxonID', (int) $search);
                } else {
                    return $query
                        ->where('name', 'LIKE', '%'.$search.'%')
                        ->orWhereHas('taxon', function ($q) use ($search) {
                            $q->where('commonName', 'LIKE', '%'.$search.'%')
                                ->orWhere('scientificName', 'LIKE', '%'.$search.'%');
                        });
                }
            })
            ->withCount('mappings')
            ->withCount([
                'genomicAnnotations',
                'buscoAnalyses',
                'repeatmaskerAnalyses',
                'taxaminerAnalyses',
            ])
            ->withExists(['bookmarks as is_bookmarked' => function ($query) {
                $query->where('user_id', Auth::id());
            }])
            ->with('taxon.infos')
            ->paginate(12)
            ->withQueryString()
            ->through(function ($assembly) use ($wikidata) {
                $ncbiId = $assembly->taxon_ncbiTaxonID;
                $assembly->conservation_status = null;
                if ($ncbiId) {
                    $status = $wikidata->getConservationStatusByNcbiId((string) $ncbiId);
                    $assembly->conservation_status = $status['status_label'] ?? null;
                }

                return $assembly;
            })
            ->through(function ($assembly) use ($wikidata) {

                static $cache = [];
                if (! $assembly->taxon) {
                    return $assembly;
                }
                $ncbiId = $assembly->taxon_ncbiTaxonID;

                if (! isset($cache[$ncbiId])) {
                    $cache[$ncbiId] = $wikidata->getTaxonInfoByNcbiId((string) $ncbiId);
                }

                $info = $cache[$ncbiId];
                if (isset($info['wikipedia_summary'])) {
                    $assembly->wikipedia_summary = $info['wikipedia_summary'];
                }

                if (! $assembly->taxon['imageCredit'] && isset($info['image'])) {
                    $assembly->wiki_image = $info['image'];
                }

                return $assembly;
            });

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
            'assemblies' => $assemblies,
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function show($id, WikidataService $wikidata): Response
    {
        $assembly = Assembly::with(['mappings', 'genomicAnnotations', 'buscoAnalyses', 'repeatmaskerAnalyses', 'fcatAnalyses', 'taxaminerAnalyses', 'taxon'])
            ->findOrFail($id);

        $info = $wikidata->getTaxonInfoByNcbiId((string) $assembly->taxon_ncbiTaxonID);

        if (isset($info['wikipedia_summary'])) {
            $assembly->wikipedia_summary = $info['wikipedia_summary'];
        }

        if (! $assembly->taxon['imageCredit'] && isset($info['image'])) {
            $assembly->wiki_image = $info['image'];
        }

        $this->authorize('view', $assembly);

        return Inertia::render('Assembly', [
            'assembly' => $assembly,
        ]);
    }

    public function browser($id): Response
    {
        $assembly = Assembly::with(['mappings', 'genomicAnnotations', 'repeatmaskerAnalyses'])->findOrFail($id);
        $this->authorize('view', $assembly);

        return Inertia::render('GenomeBrowser', [
            'assembly' => $assembly,
        ]);
    }

    /**
     * @return JsonResponse
     *
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
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        $job = $this->dispatchTrackable('App\Jobs\ImportAssembly', payload: [$path, $taxonID, $name, $user], queue: 'long');

        return response()->json([
            'message' => 'Assembly imported successfully.',
            'jobID' => $job->id,
            'jobUser' => $job->user->name,
        ]);
    }

    /**
     * Annotations are always associated with an assembly and thus stored here.
     *
     * @return JsonResponse
     *
     * @throws AuthorizationException
     */
    public function uploadAnnotation(Request $request)
    {
        $request->validate([
            'annotation' => 'required|file|mimetypes:text/plain,text/x-gff',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255',
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
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);

        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info('Dispatching Annotation Import Job now');
        // Handle files and database entry
        $job = $this->dispatchTrackable('App\Jobs\ImportAnnotation', payload: [$path, $assemblyID, $taxonID, $name], queue: 'long');

        return response()->json([
            'message' => 'Assembly imported successfully.',
            'jobID' => $job->id,
            'jobUser' => $job->user->name,
        ]);
    }

    public function uploadMapping(Request $request)
    {
        $request->validate([
            'mapping' => 'required|file',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255',
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
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info('Dispatching Mapping Import Job');
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
            'name' => 'required|string|max:255',
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
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);
        $assemblyID = $request->input('assemblyID');
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info('Dispatching BUSCO Import Job @ '.$path);
        // Handle files and database entry
        $job = $this->dispatchTrackable('\App\Jobs\ImportBusco', payload: [$path, $assemblyID, $taxonID, $name, $user], queue: 'default');

        return response()->json([
            'message' => 'BUSCO upload complete. Dispatching import Job.',
            'jobID' => $job->id,
        ]);
    }

    public function uploadRepeatmasker(Request $request)
    {
        $request->validate([
            'summary' => 'required|file',
            'out' => 'required|file',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
        ]);

        // Enforce assembly policy on RepeatMasker imports
        $assemblyID = $request->input('assemblyID');
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('update', $assembly);

        // Store in upload directory
        $file = $request->file('summary');
        $uniqueName = Str::random(20);

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName.'.tbl');
        $file = $request->file('out');
        $path = $file->storeAs('uploads', $uniqueName.'.out');

        $assemblyID = $request->input('assemblyID');
        $taxonID = $request->input('taxonID');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info('Dispatching Repeatmasker Import Job @ '.$path);
        // Handle files and database entry
        $this->dispatchTrackableChain([
            [
                'class' => ImportRepeatmasker::class,
                'payload' => ["uploads/$uniqueName", $assemblyID, $taxonID],
            ],
            [
                'class' => ImportAnnotation::class,
                'payload' => ["uploads/$uniqueName.tbl.gff", $assemblyID, $taxonID, 'Repeatmasker', true],
            ],
        ], queue: 'long');

        return response()->json([
            'message' => 'Upload successful. Dispatching RepeatMasker Import Job',
        ]);
    }

    public function stats(Request $request)
    {
        $totalAssemblies = Cache::remember('totalAssemblies', 604800, function () {
            return Assembly::count();
        });

        $taxaWithAssemblies = Cache::remember('taxaWithAssemblies', 604800, function () {
            return Taxon::whereHas('assemblies')->count();
        });

        $root_taxon = Taxon::where('ncbiTaxonID', 1)->first();
        if ($root_taxon) {
            $rootUpdate = $root_taxon->updated_at->format('d.m.Y');
        } else {
            $rootUpdate = 'never';
        }

        return Inertia::render('Welcome', [
            'totalAssemblies' => $totalAssemblies,
            'taxaWithAssemblies' => $taxaWithAssemblies,
            'rootUpdate' => $rootUpdate,
        ]);
    }

    public function taxonomicAssignmentStats(Request $request, $assemblyID)
    {
        $assembly = Assembly::findOrFail($assemblyID);
        $analysis = TaxaminerAnalysis::where('assembly_id', $assemblyID)->first();

        if (! $analysis) {
            return response()->json([
                'data' => null,
                'message' => 'No taxaminer analysis found for assembly '.$assemblyID.'.',
            ]);
        }

        // Pull diamond records and group by / count by taxon label
        $counts = TaxaminerDiamondRecord::where('taxaminer_analysis_id', $analysis->id)
            ->select('ssciname')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('ssciname')
            ->pluck('count', 'ssciname');

        return response()->json([
            'data' => $counts,
            'message' => 'Taxonomic assignments extracted from taXaminer analysis'.$analysis->id,
        ]);
    }
}
