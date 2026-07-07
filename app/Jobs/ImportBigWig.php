<?php

namespace App\Jobs;

use AllowDynamicProperties;
use App\Jobs\Base\TrackableJob;
use App\Models\genomicAnnotation;
use App\Models\WiggleTrack;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImportBigWig extends TrackableJob
{
    use Queueable;

    protected string $filepath;

    protected string $type;

    protected int $assemblyID;

    protected int $taxonID;

    protected string $name;
    protected $user;

    protected bool $is_coverage;

    public function __construct(int $userJobId, string $filepath, int $assemblyID, int $taxonID, string $name, $user, $is_coverage = false)
    {
        parent::__construct($userJobId);

        $this->filepath = $filepath;
        $this->assemblyID = $assemblyID;
        $this->taxonID = $taxonID;
        $this->name = $name;
        $this->user = $user;
        $this->is_coverage = $is_coverage;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        //
        $this->markRunning();

        $vault = Storage::disk('vault');
        $local = Storage::disk('local');
        $sourcePath = $local->path($this->filepath.'.bw');

        if (! file_exists($sourcePath)) {
            throw new \RuntimeException("BigWig file not found: {$sourcePath}");
        }

        $track = new wiggleTrack;
        $track->assembly_id = $this->assemblyID;
        $track->name = $this->name;
        $track->user_id = $this->user->id;
        if ($this->is_coverage) {
            $track->category('Default Tracks');
        }
        $track->save();


        $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/wiggle_tracks/{$track->id}.bw";
        $targetDir = dirname($targetPath);
        if (! $vault->exists($targetDir)) {
            Log::info("Directory {$targetDir} does not exist");
            $vault->makeDirectory($targetDir);
        }

        // Save file
        $vault->put($targetPath, $local->get($this->filepath));

    }
}
