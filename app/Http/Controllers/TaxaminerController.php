<?php

namespace App\Http\Controllers;

use App\Jobs\ImportTaxaminer;
use App\Models\Assembly;
use App\Models\TaxaminerConfig;
use App\Models\TaxaminerDiamondRecord;
use App\Notifications\UploadComplete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TaxaminerController extends Controller
{
    //
    public function fetchSummary($taxonID, $assemblyID, $analysisID)
    {
        $vault = Storage::disk('vault');
        $targetPath = "taxa/{$taxonID}/{$assemblyID}/taxaminerAnalyses/{$analysisID}/summary.txt";

        return response()->file($vault->path($targetPath), [
            'Content-Type' => 'text/plain',
        ]);
    }

    public function fetchDiamond($taxonID, $assemblyID, $analysisID, Request $request)
    {
        $request->validate([
            'fasta_header' => 'required|string',
        ]);

        $res = TaxaminerDiamondRecord::where([
            'taxaminer_analysis_id' => $analysisID,
            'qseqid' => $request->input('fasta_header'),
        ])->get();

        return response()->json($res);
    }

    public function fetchSequence($taxonID, $assemblyID, $analysisID, Request $request)
    {
        $request->validate([
            'fasta_header' => 'required|string',
        ]);

        $vault = Storage::disk('vault');
        $targetPath = "taxa/{$taxonID}/{$assemblyID}/taxaminerAnalyses/{$analysisID}/";
        $result = Process::run('samtools faidx '.$vault->path($targetPath.'proteins.faa.gz '.escapeshellarg($request->get('fasta_header'))));
        Log::info($result->command());

        $response = Response::make($result->output());
        $response->header('Content-Type', 'text/plain');

        return $response;
    }

    public function fetchData($taxonID, $assemblyID, $analysisID)
    {

        $vault = Storage::disk('vault');
        $targetPath = "taxa/{$taxonID}/{$assemblyID}/taxaminerAnalyses/{$analysisID}/";

        $handle = fopen($vault->path($targetPath), 'r');

        if ($handle === false) {
            throw new Exception("Cannot open file: $path");
        }

        $headers = fgetcsv($handle); // first row = column names
        $labeled_dict = [];

        while (($row = fgetcsv($handle)) !== false) {
            $assoc = array_combine($headers, $row); // make associative array
            $labeled_dict[$assoc['g_name']] = $assoc;
        }

        fclose($handle);

        return response()->json($labeled_dict);
    }

    public function scatterData($taxonID, $assemblyID, $analysisID)
    {
        $vault = Storage::disk('vault');
        $targetPath = "taxa/{$taxonID}/{$assemblyID}/taxaminerAnalyses/{$analysisID}/gene_table_taxon_assignment.csv";
        Log::debug('Attempting to read from '.$vault->path($targetPath));
        $handle = fopen($vault->path($targetPath), 'r');
        if ($handle === false) {
            throw new Exception("Cannot open file: $path");
        }

        $headers = fgetcsv($handle);
        $labeled_dict = [];

        while (($row = fgetcsv($handle)) !== false) {
            $assoc = array_combine($headers, $row);

            $label = $assoc['plot_label'];

            if (isset($labeled_dict[$label])) {
                $labeled_dict[$label][] = $assoc;
            } else {
                $labeled_dict[$label] = [$assoc];
            }
        }

        fclose($handle);

        // Convert grouped dictionary to list of lists
        $traces_list = array_values($labeled_dict);

        return response()->json($traces_list);
    }

    public function fetchUserConfig($taxonID, $assemblyID, $analysisID)
    {
        $user = Auth::user();
        $config = TaxaminerConfig::where('user_id', $analysisID)->where('taxaminer_analysis_id', $analysisID)->first();

        // Create new config entry
        if (! $config) {
            $config = new TaxaminerConfig;
            $config->user_id = $user->id;
            $config->assembly_id = $assemblyID;
            $config->taxaminer_analysis_id = $analysisID;
            $config->save();
        }
        $config->update();

        return response()->json([
            'custom_fields' => [],
            'selection' => [],
        ]);
    }

    public function saveUserConfig($taxonID, $assemblyID, $analysisID, Request $request)
    {

        $request->validate([
            'fields' => 'required|json',
            'selection' => 'required|json',
        ]);

        $user = Auth::user();
        $config = TaxaminerConfig::where('user_id', $analysisID)->where('taxaminer_analysis_id', $analysisID)->first();

        // Create new config entry
        if (! $config) {
            $config = new TaxaminerConfig;
            $config->user_id = $user->id;
            $config->assembly_id = $assemblyID;
            $config->taxaminer_analysis_id = $analysisID;
            $config->custom_fields = json_encode($request->fields);
            $config->selection = json_encode($request->selection);
            $config->save();
        }
        $config->update();

        return 200;
    }

    public function fetchPCA($taxonID, $assemblyID, $analysisID)
    {
        $vault = Storage::disk('vault');

        $file1 = $vault->path("taxa/{$taxonID}/{$assemblyID}/taxaminerAnalyses/{$analysisID}/contribution_of_variables.csv");
        $file2 = $vault->path("taxa/{$taxonID}/{$assemblyID}/taxaminerAnalyses/{$analysisID}pca_loadings.csv");

        if (is_file($file1)) {
            $lines = file($file1, FILE_IGNORE_NEW_LINES);
        } elseif (is_file($file2)) {
            $lines = file($file2, FILE_IGNORE_NEW_LINES);
        } else {
            return [];
        }

        $final_lines = [];

        // skip first and last line
        for ($i = 1; $i < count($lines) - 1; $i++) {
            $fields = explode(',', $lines[$i]);
            $new_dict = [
                'label' => $fields[0],
                'x' => [$fields[1]],
                'y' => [$fields[2]],
                'z' => [$fields[3]],
            ];
            $final_lines[] = $new_dict;
        }

        return response()->json($final_lines);
    }

    public function uploadTaxaminer(Request $request)
    {
        $request->validate([
            'archive' => 'required|file',
            'assemblyID' => 'required|integer|exists:assemblies,id', // Ensure assembly exists
            'taxonID' => 'required|integer|exists:taxa,ncbiTaxonID', // Ensure taxon ID exists
            'name' => 'required|string|max:255',
        ]);

        // Enforce assembly policy on BUSCO imports
        $assemblyID = $request->input('assemblyID');
        $assembly = Assembly::where('id', $assemblyID)->first();
        $this->authorize('update', $assembly);

        // Store in upload directory
        $file = $request->file('archive');
        $originalExtension = $file->getClientOriginalExtension();
        $uniqueName = Str::random(20);  // Generate a random string for uniqueness

        // Store the file with a unique name and the original extension
        $path = $file->storeAs('uploads', $uniqueName.'.'.$originalExtension);
        $assemblyID = $request->input('assemblyID');
        $taxonID = $request->input('taxonID');
        $name = $request->input('name');
        $user = Auth::user();

        if ($user) {
            $user->notify(new UploadComplete($path));
        } else {
            return 403;
        }

        Log::info('Dispatching taXaminer Import Job @ '.$path);
        // Handle files and database entry
        ImportTaxaminer::dispatch($path, $assemblyID, $taxonID, $name);

        return response()->json([
            'message' => 'Taxaminer Import started',
            'path' => $path,
        ]);
    }
}
