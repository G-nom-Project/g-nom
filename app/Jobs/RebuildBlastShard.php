<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Models\Assembly;
use App\Models\Shard;
use App\Models\UserJob;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Throwable;

class RebuildBlastShard extends TrackableJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    protected int $shardID;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userJobId, int $shardID)
    {
        //
        parent::__construct($userJobId);
        $this->shardID = $shardID;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Set BLAST DB lock
        Cache::put('rebuilding_blast_shard', true);
        $this->markRunning();

        try {
            // Obtain all assemblies in the shard
            $shard_assemblies = Assembly::where('shard_id', $this->shardID)->get();
            $vault = Storage::disk('vault');
            $assembly_paths = '';
            foreach ($shard_assemblies as $assembly) {
                $assembly_paths .= $vault->path("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/assembly.fa.gz ");
            }

            Log::info('Rebuilding BLAST database shard for '.$assembly_paths);

            $result = Process::run("zcat $assembly_paths | makeblastdb -title 'G-nom Shard $this->shardID' -dbtype nucl -out {$vault->path('blast/shards/shard_'.$this->shardID)}");
            if ($result->failed()) {
                Log::critical('Failed to build BLAST DB shard: '.$result->errorOutput());
                $this->fail('Failed to build BLAST DB shard');
            }

            // Update BLAST DB
            $shards_list = '';
            $shards = Shard::all();
            foreach ($shards as $shard) {
                $shards_list .= "shards/shard_$shard->id ";
            }

            $result = Process::run("(cd {$vault->path('blast/')} && blastdb_aliastool -dblist '$shards_list' -dbtype nucl -out g-nom -title 'G-nom Full database')");
            if ($result->failed()) {
                Log::critical('Failed to build BLAST Alias: '.$result->errorOutput());
                $this->fail('Failed to build BLAST Alias');
                $this->markFailed();
            }

            // Dispatch deferred jobs
            $pending = UserJob::where('job_class', 'SingleBlastQuery')->where('status', 'pending')->get();
            Log::info("Dispatching deferred BLAST searches ({$pending->count()})");
            foreach ($pending as $job) {
                Log::info($job->payload['query']);
                SingleBlastQuery::dispatch($job->id, $job->payload['query'], $job->user_id);
            }
            $this->markCompleted();
        } finally {
            Log::info('Releasing BLAST Rebuild lock');
            Cache::forget('rebuilding_blast_shard');
        }
    }

    public function failed(?Throwable $e): void
    {
        // Always clear the lock
        Cache::forget('rebuilding_blast_shard');
    }
}
