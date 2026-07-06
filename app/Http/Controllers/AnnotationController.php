<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\genomicAnnotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AnnotationController extends Controller
{
    //

    public function destroy(Request $request, $id)
    {
        $vault = Storage::disk('vault');
        $annotation = genomicAnnotation::where('id', $id)->firstOrFail();
        $assembly = Assembly::where('id', $annotation->assembly_id)->firstOrFail();
        $this->authorize('update', $assembly);

        genomicAnnotation::destroy($id);
        // Raw file (backwards compatibility)
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/{$id}")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/{$id}");
        }

        // Sorted GFF file
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/{$id}.sorted.gff3.gz")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/{$id}.sorted.gff3.gz");
        }

        // Tabix
        if ($vault->exists("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/{$id}.sorted.gff3.gz.tbi")) {
            $vault->delete("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/annotations/{$id}.sorted.gff3.gz.tbi");
        }

        Log::info("Deleted Annotation {$id} for {$assembly->id}");

        return redirect("/taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/edit");
    }
}
