<?php

namespace App\Http\Controllers;

use App\Models\Assembly;
use App\Models\BuscoAnalysis;
use App\Models\FcatAnalysis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FCatController extends Controller
{
    //
    public function destroy(Request $request, $id)
    {
        $fcat = FcatAnalysis::where('id', $id)->firstOrFail();
        $assembly = Assembly::where('id', $fcat->assembly_id)->firstOrFail();
        $this->authorize('update', $assembly);

        FcatAnalysis::destroy($id);

        Log::info("Deleted fCat {$id} for {$assembly->id}");
        return redirect("/taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/edit");
    }
}
