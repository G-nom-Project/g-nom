<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBookmarkRequest;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BookmarkController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Bookmark::class, 'bookmark');
    }

    public function bookmarkedAssemblies()
    {
        $bookmarks = Auth::user()
            ->bookmarks()
            ->with(['assembly' => function ($query) {
                $query->withCount([
                    'mappings',
                    'genomicAnnotations',
                    'buscoAnalyses',
                    'repeatmaskerAnalyses',
                    'taxaminerAnalyses',
                ])->with('taxon.infos');
            }])
            ->paginate(10);

        // Transform paginated results to extract assemblies while preserving pagination structure
        $assemblies = $bookmarks->through(fn ($bookmark) => $bookmark->assembly);

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
