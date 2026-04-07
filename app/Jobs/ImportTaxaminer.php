<?php

namespace App\Jobs;

use App\Models\TaxaminerAnalysis;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ImportTaxaminer implements ShouldQueue
{
    use Queueable;

    protected string $filepath;

    protected string $name;

    protected int $assemblyID;

    protected int $taxonID;

    /**
     * Create a new job instance.
     */
    public function __construct($filepath, $assemblyID, $taxonID, string $name)
    {
        //
        $this->filepath = $filepath;
        $this->assemblyID = $assemblyID;
        $this->taxonID = $taxonID;
        $this->name = $name;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        //
        $analysis = new TaxaminerAnalysis;
        $analysis->assembly_id = $this->assemblyID;
        $analysis->name = $this->name;
        $analysis->save();

        $analysisID = $analysis->id;

        $local = Storage::disk('local');
        $zip = new ZipArchive;
        $res = $zip->open($local->path($this->filepath));
        $vault = Storage::disk('vault');

        if ($res) {
            $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/taxaminerAnalyses/{$analysisID}/";
            $zip->extractTo($vault->path($targetPath));
            $zip->close();
            Log::warning('Taxaminer zip extracted to '.$targetPath);
        } else {
            Log::warning('failed to open zip file');

            return;
        }

        $result = Process::run('bgzip '.escapeshellarg($vault->path($targetPath.'proteins.faa')));
        if ($result->failed()) {
            Log::critical('bgzip failed: '.$result->errorOutput());
            $this->fail('Failed while compressing file!');
        }

        $result = Process::run('samtools faidx '.escapeshellarg($vault->path($targetPath.'proteins.faa.gz')));
        if ($result->failed()) {
            Log::critical('samtools faidx failed: '.$result->errorOutput());
            $this->fail('Failed while generating FASTA index!');
        }

        /** Import of diamond results
         * Relevant fields in correspondence to the reduced output mode are:
         * ['qseqid', 'sseqid', 'pident', 'length', evalue', 'bitscore', 'staxids', 'ssciname']
         */
        $file = fopen($vault->path("taxa/{$this->taxonID}/{$this->assemblyID}/taxaminerAnalyses/{$analysisID}/taxonomic_hits.txt"), 'r');

        $headers = fgetcsv($file, 0, "\t");

        $batch = [];
        $batchSize = 1000;

        while (($row = fgetcsv($file, 0, "\t")) !== false) {
            $data = array_combine($headers, $row);

            $batch[] = [
                'taxaminer_analysis_id' => $analysisID,
                'qseqid' => $data['qseqid'],
                'sseqid' => $data['sseqid'],
                'pident' => $data['pident'],
                'length' => $data['length'],
                'evalue' => $data['evalue'],
                'bitscore' => $data['bitscore'],
                'staxids' => $data['taxid'],
                'ssciname' => $data['taxname'],

                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= $batchSize) {
                Log::info("Inserting batch size: $batchSize");
                DB::table('taxaminer_diamond_hits')->insert($batch);
                $batch = [];
            }
        }

        if ($batch) {
            DB::table('taxaminer_diamond_hits')->insert($batch);
        }

        fclose($file);
    }
}
