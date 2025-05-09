<?php

namespace App\Http\Controllers;

use App\Models\Taxon;
use Illuminate\Http\JsonResponse;

class TaxonController extends Controller
{

    public function assemblies($id): JsonResponse
    {
        $taxon = Taxon::with(["assemblies"])->where("ncbiTaxonID", $id)->first();

        return response()->json([
            "taxon" => $taxon,
        ]);
    }
}
