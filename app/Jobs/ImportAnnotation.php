<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Models\genomicAnnotation;
use App\Models\User;
use App\Models\UserJob;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ImportAnnotation extends TrackableJob
{
    use Queueable;
    use SerializesModels;

    protected string $filepath;

    protected int $assemblyID;

    protected int $taxonID;

    protected string $name;

    protected string $category;

    protected $user;

    protected bool $is_repeatmasker;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userJobId, string $filepath, int $assemblyID, int $taxonID, string $name, $is_repeatmasker = false, $category = 'Annotations')
    {
        //
        parent::__construct($userJobId);

        $this->filepath = $filepath;
        $this->assemblyID = $assemblyID;
        $this->taxonID = $taxonID;
        $this->name = $name;
        $job = UserJob::where('id', $userJobId)->first();
        $this->user = User::where('id', $job->user_id)->first();
        $this->is_repeatmasker = $is_repeatmasker;
        $this->category = $category;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->markRunning();

        //
        $annotation = new genomicAnnotation;
        $annotation->assembly_id = $this->assemblyID;
        $annotation->name = $this->name;
        $annotation->user_id = $this->user->id;
        $annotation->path = '';
        $annotation->featureCount = 0;

        if ($this->is_repeatmasker) {
            $annotation->category = 'Default Tracks';
        } else {
            $annotation->category = $this->category;
        }

        // Write to DB and obtain new ID
        $annotation->save();
        $annotationID = $annotation->id;

        // Storage disks
        $vault = Storage::disk('vault');
        $local = Storage::disk('local');

        $sourcePath = $this->filepath;
        if ($this->is_repeatmasker) {
            $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/annotations/repeatmasker";
            $annotation->path = $targetPath;
            $annotation->save();
        } else {
            $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/annotations/{$annotationID}";
        }

        if ($local->exists($sourcePath)) {
            $targetDir = dirname($targetPath);
            if (! $vault->exists($targetDir)) {
                $vault->makeDirectory($targetDir);
            }

            // Save file
            Storage::disk('vault')->put($targetPath, $local->get($this->filepath));
        }

        Log::info("[$this->userJobId] Annotation files copied");
        $this->setProgress(25);
        $this->prepareJBrowse($targetPath);

        // Clean up
        // Storage::delete($local->get($this->filepath));
        $this->markCompleted();
    }

    public function prepareJBrowse(string $path): void
    {
        $vault = Storage::disk('vault');

        // Sort GFF file
        $script = base_path('resources/scripts/gff3sort/gff3sort.pl');
        $result = Process::timeout(1500)->run("$script ".escapeshellarg($vault->path($path)).' > '.escapeshellarg($vault->path($path.'.sorted.gff3')));
        if ($result->failed()) {
            Log::error('GFF Error: '."$script ".escapeshellarg($vault->path($path)).' > '.escapeshellarg($vault->path($path.'.sorted.gff3')));
            throw new \Exception('genometools failed: '.$result->errorOutput());
        }
        $this->filepath = $path.'.sorted.gff3';
        Log::debug("[$this->userJobId] Passed GFF sort");
        $this->setProgress(50);

        // Compress sorted GFF file
        $result = Process::timeout(1500)->run('bgzip --force '.escapeshellarg($vault->path($this->filepath)));
        if ($result->failed()) {
            Log::error("[$this->userJobId] Failed Compression -> ".$result->command()."\n -> ".$result->errorOutput());
            throw new \Exception('bgzip failed: '.$result->errorOutput());
        }
        $this->filepath = $this->filepath.'.gz';
        Log::debug("[$this->userJobId] Passed Compression");
        $this->setProgress(75);

        // Generate Tabix
        $result = Process::timeout(1500)->run('tabix -p gff '.escapeshellarg($vault->path($this->filepath)));
        if ($result->failed()) {
            Log::critical('tabix failed: '.$result->errorOutput());
            throw new \RuntimeException('tabix failed: '.$result->errorOutput());
        }
        Log::debug("[$this->userJobId] Passed tabix");
        $this->setProgress(95);
    }

    public function failed(\Throwable $e): void
    {
        Log::critical($e->getMessage());
        $this->markFailed($e);
    }
}
