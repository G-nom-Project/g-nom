<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Models\TaxaminerAnalysis;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ImportTaxaminer extends TrackableJob
{
    use Queueable;

    protected string $filepath;

    protected string $name;

    protected int $assemblyID;

    protected int $taxonID;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userJobId, string $filepath, int $assemblyID, int $taxonID, string $name)
    {
        //
        parent::__construct($userJobId);
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
        $this->markRunning();
        $analysis = new TaxaminerAnalysis;
        $analysis->assembly_id = $this->assemblyID;
        $analysis->name = $this->name;
        $analysis->save();
        Log::debug($analysis);
        $analysisID = $analysis->id;

        $local = Storage::disk('local');
        $zip = new ZipArchive;
        $res = $zip->open($local->path($this->filepath));
        $vault = Storage::disk('vault');

        if ($res) {
            $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/taxaminerAnalyses/{$analysisID}/";
            $zip->extractTo($vault->path($targetPath));
            $zip->close();
            Log::debug('Taxaminer zip extracted to '.$targetPath);
        } else {
            Log::warning('failed to open zip file');

            return;
        }
        $this->setProgress(10);
        $result = Process::timeout(1500)->run('bgzip '.escapeshellarg($vault->path($targetPath.'proteins.faa')));
        if ($result->failed()) {
            throw new \RuntimeException('bgzip failed: '.$result->errorOutput());
        }
        $this->setProgress(30);
        $result = Process::timeout(1500)->run('samtools faidx '.escapeshellarg($vault->path($targetPath.'proteins.faa.gz')));
        if ($result->failed()) {
            throw new \RuntimeException('Failed while generating FASTA index: '.$result->errorOutput());
        }
        $this->setProgress(50);
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
                DB::table('taxaminer_diamond_hits')->insert($batch);
                $batch = [];
            }
        }

        if ($batch) {
            DB::table('taxaminer_diamond_hits')->insert($batch);
        }

        fclose($file);
        $this->markCompleted([]);
    }

    public function failed(\Throwable $e): void
    {
        $this->markFailed($e);
    }
}
