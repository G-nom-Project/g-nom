<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\AssemblyCollection;
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
        $collection = AssemblyCollection::where('id', $id)->with('assemblies')->firstOrFail();

        $assemblies = Assembly::query()
            ->visibleTo($request->user())
            ->whereHas('collections', function ($q) use ($id) {
                $q->where('collections.id', $id);
            })->get();

        $admin = Auth::user()->id === $collection->user_id;
        $this->authorize('view', $collection);

        // Pass the data to the Inertia component
        return Inertia::render('Collections/CollectionPage', [
            'collection' => $collection,
            'assemblies' => $assemblies,
            'is_admin' => $admin,
        ]);
    }

    public function gallery(Request $request, $id)
    {
        $collection = AssemblyCollection::findOrFail($id);
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
            ->paginate(12);

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

        return json_encode(['collection' => $collection]);
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
        $collection->assemblies()->attach($validated['assemblyID']);

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
