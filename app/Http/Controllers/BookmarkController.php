<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBookmarkRequest;
use App\Models\Assembly;
use App\Models\Bookmark;
use App\Services\ApplicationModeService;
use App\Services\WikidataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BookmarkController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Bookmark::class, 'bookmark');
    }

    public function bookmarkedAssemblies(Request $request, WikidataService $wikidata)
    {
        $bookmarks = Auth::user()
            ->bookmarks()
            ->with([
                'assembly' => function ($query) use ($request) {
                    $query
                        ->withCount([
                            'mappings',
                            'genomicAnnotations',
                            'buscoAnalyses',
                            'repeatmaskerAnalyses',
                            'taxaminerAnalyses',
                        ])
                        ->with('taxon.infos')
                        ->withExists([
                            'bookmarks as is_bookmarked' => function ($query) {
                                $query->where('user_id', Auth::id());
                            },
                        ])
                        ->with([
                            'collections' => function ($query) use ($request) {
                                $query->visibleTo($request->user());
                            },
                        ]);
                },
            ])
            ->paginate(10);



        if (app(ApplicationModeService::class)->isWikidataEnabled()) {
            $ids = $bookmarks->getCollection()
                ->pluck('assembly.taxon_ncbiTaxonID')
                ->filter()
                ->unique()
                ->values()
                ->all();

            // Batched wikidata request
            $wikidataInfo = $wikidata->getTaxaInfoChunk($ids) ?? [];
            $assemblies = $bookmarks->through(function ($bookmark) use ($wikidataInfo) {
                $assembly = $bookmark->assembly;
                $ncbiId = $assembly->taxon_ncbiTaxonID;
                $assembly->conservation_status = null;

                if ($ncbiId && isset($wikidataInfo[$ncbiId])) {
                    $info = $wikidataInfo[$ncbiId];
                    $assembly->conservation_status =
                        $info['status_label'] ?? null;

                    if (
                        $assembly->taxon &&
                        ! $assembly->taxon['imageCredit'] &&
                        isset($info['image'])
                    ) {
                        $assembly->wiki_image = $info['image'];
                    }

                    if (isset($info['wikipedia_url'])) {
                        $assembly->wikipedia_url = $info['wikipedia_url'];
                    }

                    if (isset($info['wikipedia_summary'])) {
                        $assembly->wikipedia_summary = $info['wikipedia_summary'];
                    }
                }
                return $assembly;
            });
        }


        return Inertia::render('Bookmarks', [
            'assemblies' => $assemblies,
            'pagination' => [
                'current_page' => $bookmarks->currentPage(),
                'last_page' => $bookmarks->lastPage(),
                'per_page' => $bookmarks->perPage(),
                'total' => $bookmarks->total(),
                'next_page_url' => $bookmarks->nextPageUrl(),
                'prev_page_url' => $bookmarks->previousPageUrl(),
            ],
        ]);
    }

    public function index()
    {
        $bookmarks = Bookmark::where('user_id', Auth::id())->with('assembly')->get();

        return response()->json($bookmarks);
    }

    public function store(int $id, Request $request)
    {
        $assembly = Assembly::findOrFail($id);
        $this->authorize('view', $assembly);
        $bookmark = Bookmark::create([
            'user_id' => Auth::id(),
            'assembly_id' => $id,
        ]);

        return response()->json($bookmark, 201);
    }

    public function show(Bookmark $bookmark)
    {
        return response()->json($bookmark);
    }

    public function update(UpdateBookmarkRequest $request, Bookmark $bookmark)
    {
        $bookmark->update(['assembly_id' => $request->assembly_id]);

        return response()->json($bookmark);
    }

    public function delete(int $assembly_id)
    {
        $user = Auth::user();
        $bookmark = Bookmark::where('assembly_id', $assembly_id)->where('user_id', $user->id)->first();
        if ($bookmark) {
            $bookmark->delete();

            return 200;
        } else {
            return 404;
        }
    }

    public function destroy(Bookmark $bookmark)
    {
        $bookmark->delete();

        return response()->json(['message' => 'Bookmark deleted']);
    }
}
