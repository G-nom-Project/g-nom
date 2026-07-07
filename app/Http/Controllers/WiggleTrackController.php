<?php

namespace App\Http\Controllers;

use App\Jobs\Concerns\DispatchesTrackableJobs;
use App\Models\Assembly;
use App\Models\WiggleTrack;
use App\Notifications\UploadComplete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WiggleTrackController extends Controller
{
    use DispatchesTrackableJobs;
    //
    public function importWiggleTrack(Request $request)
    {
        $request->validate([
            'wiggle' => 'required|file|mimetypes:application/octet-stream',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255',
        ]);

        // Enforce assembly policy an annotations
        $assemblyID = $request->input('assemblyID');
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('update', $assembly);

        // Store in upload directory
        $file = $request->file('wiggle');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);

        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info('Dispatching Wiggle Import Job now');
        // Handle files and database entry
        $job = $this->dispatchTrackable('App\Jobs\ImportBigWig', payload: [$path, $assemblyID, $taxonID, $name, $user], queue: 'long');

        return response()->json([
            'message' => 'Wiggle Track import started successfully.',
            'jobID' => $job->id,
            'jobUser' => $job->user->name,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $vault = Storage::disk('vault');
        $track = WiggleTrack::where('id', $id)->firstOrFail();
        $assembly = Assembly::where('id', $track->assembly_id)->firstOrFail();
        $this->authorize('update', $assembly);

        WiggleTrack::destroy($id);
        // Raw file (backwards compatibility)
        if ($vault->exists("taxa/{$assembly->taxonID}/{$assembly->id}/wiggle_tracks/{$track->id}.bw")) {
            $vault->delete("taxa/{$assembly->taxonID}/{$assembly->id}/wiggle_tracks/{$track->id}.bw");
        }

        Log::info("Deleted WiggleTrack {$id} for {$assembly->id}");

        return redirect("/taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/edit");
    }
}
