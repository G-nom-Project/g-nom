<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\Taxon;
use App\Models\TaxonGeneralInfo;
use App\Models\TaxonGeoData;
use App\Notifications\UploadComplete;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $taxon = Taxon::with(["assemblies"])->where("ncbiTaxonID", $id)->first();
        return Inertia::render('Taxon', [
            'taxon' => $taxon
        ]);
    }

    public function assemblies(Request $request, $id): JsonResponse
    {
        $taxon = Taxon::with([
            'assemblies' => function ($query) use ($request) {
                $query->visibleTo($request->user());
            }
        ])->where('ncbiTaxonID', $id)->first();

        return response()->json([
            'taxon' => $taxon,
        ]);
    }

    public function getLineage(int $ncbiTaxonID): JsonResponse
    {
        // Retrieving lineages may be time-intensive -> cache for one week
        $value = Cache::remember('lineage-' . $ncbiTaxonID, 604800, function () use ($ncbiTaxonID) {
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

    public function getGeoData(int $ncbiTaxonID): JsonResponse
    {
        $taxon = Taxon::where('ncbiTaxonID', $ncbiTaxonID)->with(["geoData"])->first();
        return response()->json($taxon);
    }

    /**
     * @throws AuthorizationException
     */
    public function uploadGeoData($taxonID, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'source_link' => 'required|string|max:512',
            'data_link' => 'nullable|string|max:512',
            'data' => 'nullable|json',
        ]);

        $now = now();

        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->firstOrFail();
        $this->authorize('update', $taxon);

        $geoData = new TaxonGeoData();
        $geoData->name = $validated['name'];
        $geoData->type = $validated['type'];
        $geoData->description = $validated['description'] ?? null;
        $geoData->source_link = $validated['source_link'];
        $geoData->data_link = $validated['data_link'] ?? null;
        $geoData->data = $validated['data'] ?? null;
        $geoData->taxonID = $taxonID;
        $geoData->created_at = $now;
        $geoData->updated_at = $now;
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
            'credit' => 'required|string|max:255'
        ]);

        // Enforce policy
        $taxonID = $request->input('taxonID');
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
        $this->authorize('update', $taxon);

        $file = $request->file('image');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);


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
            $imageContents = $public->get("placeholder.PNG");
        } else {
            $imageContents = $vault->get($imagePath);
        }

        return response($imageContents, 200)
            ->header('Content-Type', 'image/webp')
            ->header('Cache-Control', 'public, max-age=604800'); // cache for 7 days
    }

    /**
     * @param Request $request
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
        Log::info("Stored icon at: " . $path);

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
     * @param $taxonID
     * @return \Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Foundation\Application|\Illuminate\Http\Response|object
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
            'text' => 'required|string|max:2000'
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
