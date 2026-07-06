<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\genomicAnnotation;
use App\Models\RepeatmaskerAnalysis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RepeatmaskerController extends Controller
{
    //
    public function destroy(Request $request, $id)
    {
        $vault = Storage::disk('vault');
        $repeatmasker = RepeatmaskerAnalysis::where('id', $id)->firstOrFail();
        $assembly = Assembly::where('id', $repeatmasker->assembly_id)->firstOrFail();
        $this->authorize('update', $assembly);

        RepeatmaskerAnalysis::destroy($id);
        // Raw file (backwards compatibility)
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/repeatmasker")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/repeatmasker");
        }

        // Sorted GFF file
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz");
        }

        // Tabix
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz.tbi")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz.tbi");
        }

        Log::info("Deleted Annotation {$id} for {$assembly->id}");

        return redirect("/taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/edit");
    }
}
