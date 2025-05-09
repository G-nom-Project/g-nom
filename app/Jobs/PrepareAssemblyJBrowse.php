<?php

namespace App\Jobs;


use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Process;
use \Illuminate\Support\Facades\Log;

class PrepareAssemblyJBrowse implements ShouldQueue
{
    use Queueable;
    protected string $filepath;
    protected string $name;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filepath, string $name)
    {
        //
        $this->filepath = $filepath;
        $this->name = $name;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {

        $gzippedFile = $this->filepath . '.gz';
        Log::warning("File is: $gzippedFile");

        // Gzip the file if it's not already gzipped
        if (!str_ends_with($this->filepath, '.gz')) {

            // Run gzip command
            Process::run("bgzip -c " . escapeshellarg($this->filepath) . " > " . escapeshellarg($gzippedFile));

            // Replace filepath with gzipped version
            $this->filepath = $gzippedFile;
        } else {
            $gzippedFile = $this->filepath;
        }

        // Generate FASTA Index
        Process::run("samtools faidx " . escapeshellarg($gzippedFile));

        // Use JBrowse utils to add config
        Process::run("jbrowse add-assembly " . escapeshellarg($gzippedFile) . " --name Test " . escapeshellarg($this->name) . " --load inPlace" );
    }
}
