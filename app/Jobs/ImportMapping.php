<?php

namespace App\Jobs;

use App\Models\genomicMapping;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ImportMapping implements ShouldQueue
{
    use Queueable;

    protected string $filepath;
    protected string $type;
    protected int $assemblyID;
    protected int $taxonID;
    protected string $name;
    protected $user;

    /**
     * Create a new job instance.
     */
    public function __construct(string $filepath, string $extension, int $assemblyID, int $taxonID, string $name, $user)
    {
        //
        $this->filepath = $filepath;
        $this->assemblyID = $assemblyID;
        $this->taxonID = $taxonID;
        $this->name = $name;
        $this->user = $user;

        // No need for further compression
        $this->type = $extension;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        //
        $mapping = new genomicMapping();
        $mapping->assembly_id = $this->assemblyID;
        $mapping->name = $this->name;
        $mapping->user_id = $this->user->getAuthIdentifier();
        $mapping->path = "";

        $mapping->save();
        $mappingID = $mapping->id;

        // Storage definitions
        $vault = Storage::disk('vault');
        $local = Storage::disk('local');
        $sourcePath = $this->filepath;
        $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/mapping/{$mappingID}";

        if ($local->exists($sourcePath)) {
            $targetDir = dirname($targetPath);
            if (!$vault->exists($targetDir)) {
                $vault->makeDirectory($targetDir);
            }

            // Save file
            Storage::disk('vault')->put($targetPath, $local->get($this->filepath));
        }

        $this->prepareJBrowse($targetPath);

    }

    public function prepareJBrowse(string $path): void

    {
        $vault = Storage::disk('vault');

        // Convert to BAM
        if (!$this->type == "bam") {
            $result = Process::run("samtools view -bS -o " . escapeshellarg($vault->path($path . "bam")) . " " . escapeshellarg($vault->path($path)));
            if ($result->failed()) {
                Log::critical("samtools failed while compressing: " . $result->errorOutput());
                $this->fail("Failed while compressing file!");
            }
        } else {
            Log::info("Skipping samtools view, file is already BAM");
            $result = Process::run("cp " . escapeshellarg($vault->path($path)) . " " . escapeshellarg($vault->path($path . "bam")));
            if ($result->failed()) {
                Log::critical("Failed to copy BAM " . $result->errorOutput());
                $this->fail("Failed while compressing file!");
            }
        }

        // Now we're at BAM
        $this->filepath = $path . ".bam";

        // Index compressed file
        $result = Process::run("samtools index" . escapeshellarg($vault->path($this->filepath)));
        if ($result->failed()) {
            Log::critical("samtools failed while indexing: " . $result->errorOutput());
            $this->fail("Failed while compressing file!");
        }
    }
}
