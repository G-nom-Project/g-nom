<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Models\FcatAnalysis;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImportFcat extends TrackableJob
{
    use Queueable;

    protected string $filepath;

    protected int $assemblyID;

    protected int $taxonID;

    protected string $name;

    protected $user;


    /**
     * Create a new job instance.
     */
    public function __construct(int $userJobId, string $filepath, int $assemblyID, int $taxonID, string $name, $user)
    {
        parent::__construct($userJobId);

        $this->filepath = $filepath;
        $this->assemblyID = $assemblyID;
        $this->taxonID = $taxonID;
        $this->name = $name;
        $this->user = $user;
    }
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->markRunning();
        $local = Storage::disk('local');
        $sourcePath = $local->path($this->filepath);
        $analysis = $this->parseFcat($sourcePath, $this->assemblyID);
        $this->markCompleted(["Parsed" => $analysis]);
    }

    public function parseFcat(string $path, int $assemblyId): FcatAnalysis
    {

        if (! file_exists($path)) {
            $this->fail(new FileNotFoundException("Unable to open file: {$path}"));
        }
        $handle = fopen($path, 'r');

        // Skip header
        fgetcsv($handle, separator: "\t");
        $analysis = new FcatAnalysis();
        $analysis->assembly_id = $assemblyId;

        while (($row = fgetcsv($handle, separator: "\t")) !== false) {

            [
                $mode,
                $genomeID,
                $similar,
                $dissimilar,
                $duplicated,
                $missing,
                $ignored,
                $total
            ] = $row;

            $modeNumber = (int) str_replace('mode_', '', $mode);

            $prefix = "m{$modeNumber}_";

            $analysis->{$prefix . 'similar'} = $similar;
            $analysis->{$prefix . 'similarPercent'} = $similar / $total * 100;

            $analysis->{$prefix . 'dissimilar'} = $dissimilar;
            $analysis->{$prefix . 'dissimilarPercent'} = $dissimilar / $total * 100;

            $analysis->{$prefix . 'duplicated'} = $duplicated;
            $analysis->{$prefix . 'duplicatedPercent'} = $duplicated / $total * 100;

            $analysis->{$prefix . 'missing'} = $missing;
            $analysis->{$prefix . 'missingPercent'} = $missing / $total * 100;

            $analysis->{$prefix . 'ignored'} = $ignored;
            $analysis->{$prefix . 'ignoredPercent'} = $ignored / $total * 100;

            // Same for every row
            $analysis->genomeID = $genomeID;
            $analysis->total = $total;
        }

        fclose($handle);
        $analysis->save();
        return $analysis;
    }

    public function failed(\Throwable $e): void
    {
        Log::critical($e->getMessage());
        $this->markFailed($e);
    }
}
