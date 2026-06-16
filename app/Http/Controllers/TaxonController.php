<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\Taxon;
use App\Models\TaxonGeneralInfo;
use App\Models\TaxonGeoData;
use App\Notifications\UploadComplete;
use App\Services\WikidataService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Routing\ResponseFactory;
use Illuminate\Foundation\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Image\Image;

class TaxonController extends Controller
{
    public function index($id)
    {
        $taxon = Taxon::with(['assemblies'])->where('ncbiTaxonID', $id)->first();

        return Inertia::render('Taxon', [
            'taxon' => $taxon,
        ]);
    }

    public function assemblies(Request $request, $id): JsonResponse
    {
        $taxon = Taxon::with([
            'assemblies' => function ($query) use ($request) {
                $query->visibleTo($request->user());
            },
        ])->where('ncbiTaxonID', $id)->first();

        return response()->json([
            'taxon' => $taxon,
        ]);
    }

    public function getLineage(int $ncbiTaxonID): JsonResponse
    {
        // Retrieving lineages may be time-intensive -> cache for one week
        $value = Cache::remember('lineage-'.$ncbiTaxonID, 604800, function () use ($ncbiTaxonID) {
            $lineage = [];
            while ($taxon = Taxon::where('ncbiTaxonID', $ncbiTaxonID)->first()) {
                $lineage[] = $taxon;
                if ($taxon->ncbiTaxonID === 1 || $taxon->parentNcbiTaxonID === $taxon->ncbiTaxonID) {
                    break;
                }
                $ncbiTaxonID = $taxon->parentNcbiTaxonID;
            }

            return $lineage;
        });

        return response()->json(array_reverse($value));
    }

    /**
     * Pull the lineage from the NCBI taxonomy for a given taxonID
     */
    private function getLineageArray(int $ncbiTaxonID): array
    {
        $lineage = [];
        while ($taxon = Taxon::where('ncbiTaxonID', $ncbiTaxonID)->first()) {
            $lineage[] = $taxon;

            if (
                $taxon->ncbiTaxonID === 1 ||
                $taxon->parentNcbiTaxonID === $taxon->ncbiTaxonID
            ) {
                break;
            }
            $ncbiTaxonID = $taxon->parentNcbiTaxonID;
        }

        return array_reverse($lineage);
    }

    /**
     * Generate a taxonomy tree from a given array of taxonIDs
     */
    private function buildTree(array $taxonIds): array
    {
        $root = [
            'name' => 'root',
            'children' => [],
        ];

        foreach ($taxonIds as $taxonId) {
            $lineage = $this->getLineageArray($taxonId);
            $node = &$root;
            foreach ($lineage as $taxon) {
                $id = $taxon->ncbiTaxonID;
                if (! isset($node['children'][$id])) {
                    $node['children'][$id] = [
                        'name' => $taxon->scientificName,
                        'children' => [],
                    ];
                }
                $node = &$node['children'][$id];
            }
        }

        return $root;
    }

    /**
     * Converts a array representation of a tree into valid Newick
     */
    private function toNewick(array $node): string
    {
        $children = $node['children'];

        if (empty($children)) {
            return $this->escapeNewick($node['name']);
        }

        $parts = [];

        foreach ($children as $child) {
            $parts[] = $this->toNewick($child);
        }

        $label = $node['name'] !== 'root'
            ? $this->escapeNewick($node['name'])
            : '';

        return '('.implode(',', $parts).')'.$label;
    }

    /**
     * Helper function to strip chars which overlap with restricted chars in the Newick tree representation scheme.
     */
    private function escapeNewick(string $name): string
    {
        return str_replace(
            [' ', '(', ')', ':', ';', ','],
            ' ',
            $name
        );
    }

    /**
     * Builds internal taxonomic tree and renders the tree of life page.
     *
     * @return \Inertia\Response
     */
    public function getTol(Request $request)
    {
        $newick_tree = Cache::remember('tree_of_life_newick', now()->addDay(), function () {
            $taxa_ids = Assembly::pluck('taxon_ncbiTaxonID')->all();
            $tree = $this->buildTree($taxa_ids);

            return $this->toNewick($tree);
        });

        return Inertia::render('TreeOfLife', [
            'newick_tree' => $newick_tree,
        ]);
    }

    /**
     * Matches a given string against Taxa in the database.
     *
     * @return JsonResponse
     */
    public function getTaxonByName(Request $request, WikidataService $wikidata)
    {
        $validated = $request->validate([
            'taxon_name' => 'string',
        ]);

        $search = $validated['taxon_name'];
        $taxon = Taxon::where('scientificName', $search)
            ->with('infos')
            ->with('assemblies')
            ->first();

        // Attach conservation status
        if ($taxon->ncbiTaxonID) {
            $status = $wikidata->getConservationStatusByNcbiId((string) $taxon->ncbiTaxonID);
            $taxon->conservation_status = $status['status_label'] ?? null;
        }

        // Attach Wikipedia federated data
        $info = $wikidata->getTaxonInfoByNcbiId((string) $taxon->ncbiTaxonID);
        if (isset($info['wikipedia_summary'])) {
            $taxon->wikipedia_summary = $info['wikipedia_summary'];
        }
        if (! $taxon['imageCredit'] && isset($info['image'])) {
            $taxon->wiki_image = $info['image'];
        }

        return response()->json([
            'search' => $search,
            'taxon' => $taxon,
        ]);
    }

    public function getGeoData(int $ncbiTaxonID): JsonResponse
    {
        $taxon = Taxon::where('ncbiTaxonID', $ncbiTaxonID)->with(['geoData'])->first();

        return response()->json($taxon);
    }

    /**
     * @throws AuthorizationException
     */
    public function uploadGeoData($taxonID, Request $request): JsonResponse
    {
        Log::debug('Validating Geo DATA');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'source_link' => 'required|string|max:512',
            'data_link' => 'nullable|string|max:512',
            'data' => 'nullable|json',
        ]);

        Log::info('Received new Geo data'.$validated['name']);

        $geoData = new TaxonGeoData;
        $geoData->name = $validated['name'];
        $geoData->type = $validated['type'];
        $geoData->description = $validated['description'] ?? null;
        $geoData->source_link = $validated['source_link'];
        $geoData->data_link = $validated['data_link'] ?? null;
        $geoData->data = $validated['data'] ?? null;
        $geoData->taxonID = $taxonID;
        $geoData->save();

        return response()->json(['message' => 'GeoData uploaded successfully']);
    }

    public function deleteGeoData($taxonID, $id): JsonResponse
    {

        $geoData = TaxonGeoData::where('id', $id)->firstOrFail();
        Log::info("Received request to delete GeoData for taxon {$taxonID} with ID {$id}");
        // Deleting GeoData is under update Taxon policy
        $taxon = Taxon::where('ncbiTaxonID', $geoData->taxonID)->firstOrFail();
        $this->authorize('update', $taxon);
        Log::info("Authorized request tp delete GeoData for taxon {$taxonID} with ID {$id}");
        $geoData->delete();

        return response()->json(['message' => 'GeoData deleted']);
    }

    public function getInfos(int $ncbiTaxonID): JsonResponse
    {
        $taxon = Taxon::where('ncbiTaxonID', $ncbiTaxonID)
            ->with(['infos'])
            ->first();

        return response()->json($taxon);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|file|image',
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID',
            'credit' => 'required|string|max:255',
        ]);

        // Enforce policy
        $taxonID = $request->input('taxonID');
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
        $this->authorize('update', $taxon);

        $file = $request->file('image');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);

        $credit = $request->input('credit');
        $user = Auth::user();

        // Convert image to WebP and save in vault disk
        $webpPath = "taxa/{$taxonID}/image.webp";
        $vault = Storage::disk('vault');
        $webpFullPath = $vault->path($webpPath);

        Image::load($file->getPathname())
            ->format('webp')   // string format for v3.8
            ->quality(90)
            ->save($webpFullPath);

        // Set Image credit
        $taxon->imageCredit = $credit;
        $taxon->updated_at = now();
        $taxon->update();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        return response()->json([
            'message' => 'Image imported and converted successfully.',
        ]);
    }

    public function showImage($taxonID)
    {
        $vault = Storage::disk('vault');
        $public = Storage::disk('public');
        $imagePath = "taxa/{$taxonID}/image.webp";

        if (! $vault->exists($imagePath)) {
            $imageContents = $public->get('placeholder.PNG');
        } else {
            $imageContents = $vault->get($imagePath);
        }

        return response($imageContents, 200)
            ->header('Content-Type', 'image/webp')
            ->header('Cache-Control', 'public, max-age=604800'); // cache for 7 days
    }

    /**
     * @return JsonResponse
     */
    public function uploadIcon(Request $request)
    {
        $request->validate([
            'icon' => 'required|file|mimes:svg,svg+xml',
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID',
        ]);

        $taxonID = $request->input('taxonID');
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
        $this->authorize('update', $taxon);
        $file = $request->file('icon');

        // Store file
        $path = $file->storeAs("taxa/{$taxonID}", 'icon.svg', 'vault');
        Log::info('Stored icon at: '.$path);

        // Update Taxon Icon flag
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
        $taxon->phylopic = true;
        $taxon->updated_at = now();
        $taxon->update();

        return response()->json([
            'message' => 'Image imported and converted successfully.',
        ]);
    }

    /**
     * @return ResponseFactory|Application|Response|object
     */
    public function showIcon($taxonID)
    {
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();

        if ($taxon->phylopic) {
            $vault = Storage::disk('vault');
            $imagePath = "taxa/{$taxonID}/icon.svg";
            $imageContents = $vault->get($imagePath);
        } else {
            return response(401);
        }

        return response($imageContents, 200)
            ->header('Content-Type', 'image/svg+xml')
            ->header('Cache-Control', 'public, max-age=604800');
    }

    public function updateTexts(Request $request)
    {
        $request->validate([
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID',
            'headline' => 'required|string|max:512',
            'text' => 'required|string|max:2000',
        ]);

        TaxonGeneralInfo::upsert([
            'ncbiTaxonID' => $request->input('taxonID'),
            'headline' => $request->input('headline'),
            'text' => $request->input('text'),
        ], uniqueBy: ['ncbiTaxonID'], update: ['headline', 'text']);

        $taxonID = $request->input('taxonID');
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
        $this->authorize('update', $taxon);
        $taxon->updated_at = now();
        $taxon->update();

        return response()->json([
            'message' => 'Headline updated successfully.',
        ]);
    }
}
