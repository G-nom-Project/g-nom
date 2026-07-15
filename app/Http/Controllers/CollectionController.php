<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\AssemblyCollection;
use App\Services\WikidataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    //

    public function index(Request $request)
    {
        $collections = AssemblyCollection::visibleTo($request->user())->get();

        return Inertia::render('Collections/CollectionsPage', [
            'collections' => $collections,
            'can_create' => Auth::user()->can('create', AssemblyCollection::class),
            'user_id' => $request->user()->id,
        ]);
    }

    public function view(Request $request, $id): Response
    {
        // Fetch collection
        $collection = AssemblyCollection::where('id', $id)
            ->with('users:id,name')
            ->firstOrFail();

        $this->authorize('view', $collection);

        $assemblies = Assembly::query()
            ->visibleTo($request->user())
            ->whereHas('collections', function ($q) use ($id) {
                $q->where('collections.id', $id);
            })
            ->with('taxon')
            ->orderBy('created_at')
            ->get();

        $admin = Auth::user()->id === $collection->user_id;
        $currentUser = $collection->users->firstWhere('id', Auth::id());
        $role = $currentUser?->pivot->role;

        // Pass the data to the Inertia component
        return Inertia::render('Collections/CollectionPage', [
            'collection' => $collection,
            'assemblies' => $assemblies,
            'is_admin' => $admin,
            'role' => $role,
        ]);
    }

    public function gallery(Request $request, $id, WikidataService $wikidata)
    {
        $collection = AssemblyCollection::findOrFail($id);
        $this->authorize('view', $collection);
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
            ->withExists([
                'bookmarks as is_bookmarked' => fn ($q) => $q->where('user_id', Auth::id()),
            ])
            ->with('taxon.infos')
            ->with('collections')
            ->whereHas('collections', function ($q) use ($id) {
                $q->where('collections.id', $id);
            })
            ->paginate(12)
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

        return Inertia::render('Collections/Gallery', [
            'collection' => $collection,
            'assemblies' => $assemblies,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'public' => 'required|boolean',
        ]);

        $this->authorize('create', AssemblyCollection::class);

        // Create Collections
        $collection = new AssemblyCollection;
        $collection->name = $validated['name'];
        $collection->is_public = $validated['public'];
        $collection->user_id = $request->user()->id;
        $collection->save();

        // Automatically set the creator as admin
        $collection->users()->attach($request->user()->id, ['role' => 'admin']);

        return response()->json([
            'collection' => $collection,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'is_public' => 'required|boolean',
        ]);

        $collection = AssemblyCollection::where('id', $id)->with('assemblies')->firstOrFail();
        $this->authorize('admin', $collection);

        $collection->name = $validated['name'];
        $collection->is_public = $validated['is_public'];
        $collection->save();

        return response()->json([
            'collection' => $collection,
        ]);
    }

    public function remove_assembly(Request $request, $id)
    {

        $validated = $request->validate([
            'assemblyID' => 'required|integer|exists:assemblies,id',
        ]);

        $collection = AssemblyCollection::where('id', $id)->with('assemblies')->firstOrFail();
        $this->authorize('update', $collection);
        $collection->assemblies()->detach($validated['assemblyID']);

        return redirect("/collections/{$id}");
    }

    public function add_assembly(Request $request, $id)
    {

        $validated = $request->validate([
            'assemblyID' => 'required|integer|exists:assemblies,id',
        ]);

        $collection = AssemblyCollection::where('id', $id)->with('assemblies')->firstOrFail();
        $assembly = Assembly::where('id', $validated['assemblyID'])->firstOrFail();
        $this->authorize('update', $collection);
        $this->authorize('view', $assembly);
        $collection->assemblies()->attach($validated['assemblyID'], ['created_at' => now()]);

        return redirect("/collections/{$id}");
    }

    public function add_user(Request $request, $id)
    {
        $validated = $request->validate([
            'userID' => 'required|integer|exists:users,id',
            'role' => 'required|string|in:editor,viewer',
        ]);

        $collection = AssemblyCollection::findOrFail($id);

        $this->authorize('admin', $collection);

        $collection->users()->syncWithoutDetaching([
            $validated['userID'] => [
                'role' => $validated['role'],
            ],
        ]);

        return redirect("/collections/{$id}");
    }

    public function delete(Request $request, $id)
    {
        $collection = AssemblyCollection::where('id', $id)->firstOrFail();
        $this->authorize('delete', $collection);
        $collection->delete();

        return 200;
    }
}
