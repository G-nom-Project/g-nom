<?php

namespace App\Http\Controllers;

use App\Jobs\ImportAnnotation;
use App\Jobs\ImportAssembly;
use App\Jobs\ImportMapping;
use App\Jobs\PrepareAssemblyJBrowse;
use App\Notifications\UploadComplete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImportController extends Controller
{
    //
    public function uploadAssembly(Request $request)
    {
        $request->validate([
            'assembly' => 'required|file|mimes:gz,fa,txt,fasta,fna',
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // ensure taxon ID exists
            'name' => 'required|string|max:255',
        ]);

        // Store in upload directory
        $file = $request->file('assembly');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        // Handle files and database entry
        ImportAssembly::dispatch($path, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }

    public function uploadAnnotation(Request $request)
    {
        $request->validate([
            'annotation' => 'required|file|mimetypes:text/plain,text/x-gff',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255'
        ]);

        // Store in upload directory
        $file = $request->file('annotation');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);
        $assemblyID = $request->input('assemblyID');
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info("Dispatching Job now");
        // Handle files and database entry
        ImportAnnotation::dispatch($path, $assemblyID, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }

    public function uploadMapping(Request $request)
    {
        $request->validate([
            'mapping' => 'required|file',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255'
        ]);

        // Store in upload directory
        $file = $request->file('mapping');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName . '.' . $originalExtension);
        $assemblyID = $request->input('assemblyID');
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        }

        Log::info("Dispatching Job now");
        // Handle files and database entry
        ImportMapping::dispatch($path, $originalExtension, $assemblyID, $taxonID, $name, $user);


        return response()->json([
            'message' => 'Assembly imported successfully.',
            'path' => $path,
        ]);
    }
}
