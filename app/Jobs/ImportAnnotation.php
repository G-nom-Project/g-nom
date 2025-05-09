<?php

namespace App\Jobs;

use App\Models\genomicAnnotation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ImportAnnotation implements ShouldQueue
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
    public function __construct(string $filepath, int $assemblyID, int $taxonID, string $name, $user)
    {
        //
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
        //
        $annotation = new genomicAnnotation();
        $annotation->assembly_id = $this->assemblyID;
        $annotation->name = $this->name;
        $annotation->user_id = $this->user->getAuthIdentifier();
        $annotation->path = "";
        $annotation->featureCount = 0;

        // Write to DB and obtain new ID
        $annotation->save();
        $annotationID = $annotation->id;

        // Storage disks
        $vault = Storage::disk('vault');
        $local = Storage::disk('local');


        $sourcePath = $this->filepath;
        $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/annotations/{$annotationID}";

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

        // Sort GFF file
        $result = Process::run("gt gff3 -sortlines -tidy -retainids -o " . escapeshellarg($vault->path($path . ".sorted.gff3")) . " " . escapeshellarg($vault->path($path)));
        if ($result->failed()) {
            Log::critical("genometools failed: " . $result->errorOutput());
            $this->fail("Failed while sorting file!");
        }
        $this->filepath = $path . ".sorted.gff3";

        // Compress sorted GFF file
        $result = Process::run("bgzip --force " . escapeshellarg($vault->path($this->filepath)));
        if ($result->failed()) {
            Log::critical("bgzip failed: " . $result->errorOutput());
            $this->fail("Failed while compressing file!");
        }
        $this->filepath = $this->filepath . ".gz";

        // Generate Tabix
        $result = Process::run("tabix -p gff " . escapeshellarg($vault->path($this->filepath)));
        if ($result->failed()) {
            Log::critical("tabix failed: " . $result->errorOutput());
            $this->fail("Failed while generating Index!");
        }

    }
}
