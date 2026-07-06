<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\BuscoAnalysis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BUSCOController extends Controller
{
    //
    public function destroy(Request $request, $id)
    {
        $vault = Storage::disk('vault');
        $busco = BuscoAnalysis::where('id', $id)->firstOrFail();
        $assembly = Assembly::where('id', $busco->assembly_id)->firstOrFail();
        $this->authorize('update', $assembly);

        BuscoAnalysis::destroy($id);

        // Summary file
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/analyses/BUSCO/{$id}_summary.txt")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/analyses/BUSCO/{$id}_summary.txt");
            Log::info("Deleting taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/analyses/BUSCO/{$id}_summary.txt");
        }

        Log::info("Deleted BUSCO {$id} for {$assembly->id}");

        return redirect("/taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/edit");
    }
}
