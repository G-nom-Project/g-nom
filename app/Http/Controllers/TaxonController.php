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

    public function getLineage(int $ncbiTaxonID): JsonResponse
    {
        $lineage = [];

        while ($taxon = Taxon::where('ncbiTaxonID', $ncbiTaxonID)->first()) {
            $lineage[] = $taxon;
            if ($taxon->ncbiTaxonID === 1 || $taxon->parentNcbiTaxonID === $taxon->ncbiTaxonID) {
                break;
            }
            $ncbiTaxonID = $taxon->parentNcbiTaxonID;
        }

        return response()->json(array_reverse($lineage));
    }
}
