<?php

namespace App\Http\Controllers;

use App\Models\Taxon;
use App\Models\TaxonGeneralInfo;
use App\Notifications\UploadComplete;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Image\Image;
use Spatie\Image\Enums\ImageFormat;

class TaxonController extends Controller
{
    public function index($id)
    {
        $taxon = Taxon::with(["assemblies"])->where("ncbiTaxonID", $id)->first();
        return Inertia::render('Taxon', [
            'taxon' => $taxon
        ]);
    }

    public function assemblies($id): JsonResponse
    {
        $taxon = Taxon::with(["assemblies"])->where("ncbiTaxonID", $id)->first();

        return response()->json([
            "taxon" => $taxon,
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

        $file = $request->file('image');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);

        $taxonID = $request->input('taxonID');
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
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
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
            'headline' => 'required|string|max:255',
            'text' => 'required|string|max:2000'
        ]);

        TaxonGeneralInfo::upsert([
            'ncbiTaxonID' => $request->input('taxonID'),
            'headline' => $request->input('headline'),
            'text' => $request->input('text'),
        ], uniqueBy: ['ncbiTaxonID'], update: ['headline', 'text']);


        $taxonID = $request->input('taxonID');
        $taxon = Taxon::where('ncbiTaxonID', $taxonID)->first();
        $taxon->updated_at = now();
        $taxon->update();

        return response()->json([
            'message' => 'Headline updated successfully.',
        ]);
    }
}
