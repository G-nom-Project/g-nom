<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ReIndexAssemblyFiles implements ShouldQueue
{
    use Queueable;
    protected string $path;

    /**
     * Create a new job instance.
     */
    public function __construct($path)
    {
        //
        $this->path = $path;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Remove the old indices
        Storage::deleteDirectory($this->path . "/trix");
        // Generate new indices
        $result = Process::run("jbrowse text-index --force" . " --target " . Storage::path($this->path) . "/config.json --out " . Storage::path($this->path) . "/trix");
        if ($result->failed()) {
            Log::critical("JBrowse Index failed!" . $result->errorOutput());
            $this->fail("Failed while generating JBrowse Indices");
        }
    }
}
