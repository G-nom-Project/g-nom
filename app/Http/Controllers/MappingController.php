<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\genomicMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MappingController extends Controller
{
    //
    public function destroy(Request $request, $id)
    {
        $vault = Storage::disk('vault');
        $mapping = genomicMapping::where('id', $id)->firstOrFail();
        $assembly = Assembly::where('id', $mapping->assembly_id)->firstOrFail();
        $this->authorize('update', $assembly);

        genomicMapping::destroy($id);

        // BAM File
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/mappings/{$id}.bam")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/mappings/{$id}.bam");
            Log::info("Deleting taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/mappings/{$id}.bam");
        }
        // BAM Index File
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/mappings/{$id}.bai")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/mappings/{$id}.bai");
            Log::info("Deleting taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/mappings/{$id}.bai");
        }

        Log::info("Deleted Mapping {$id} for {$assembly->id}");

        return redirect("/taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/edit");
    }
}
