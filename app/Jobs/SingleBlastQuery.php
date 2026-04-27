<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * SingleBlastQuery is a queueable Laravel Job which implements a ephemeral version of a BLAST query against the G-nom
 * database. This Job is intended for quick queries and should be queued separately from longer multi-fasta jobs.
 * This Job does not perform validation on the query.
 */
class SingleBlastQuery extends TrackableJob
{
    use Queueable;

    protected string $query;

    protected int $user_id;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userJobId, string $query, $user_id)
    {
        //
        parent::__construct($userJobId);
        $this->query = $query;
        $this->user_id = $user_id;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->markRunning();
        $vault = Storage::disk('vault');
        $uuid = $this->job->uuid();
        // Unique output file tied to Job ID
        $output_path = $vault->path("blast/queries/$uuid.tsv");
        // Execute BLAST
        $result = Process::run('echo '.escapeshellarg($this->query)." | blastn -db {$vault->path('blast/g-nom')} -outfmt '6 qseqid sseqid stitle pident length mismatch gapopen qstart qend sstart send evalue bitscore' > {$output_path}");
        if ($result->failed()) {
            Log::critical('BLAST failed: '.$result->errorOutput());
            $this->fail('BLAST failed');
        }

        $this->markCompleted(['filename' => "$uuid.tsv"]);
    }
}
