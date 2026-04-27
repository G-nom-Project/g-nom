<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Jobs\Concerns\DispatchesTrackableJobs;
use App\Models\Assembly;
use App\Models\Shard;
use App\Models\UserJob;
use App\Notifications\ImportCompleted;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ImportAssembly extends TrackableJob
{
    use DispatchesTrackableJobs, Queueable;

    protected string $filepath;

    protected int $taxonID;

    protected string $name;

    protected $user;

    public function __construct(int $userJobId, string $filepath, int $taxonID, string $name, $user)
    {
        parent::__construct($userJobId);

        $this->filepath = $filepath;
        $this->taxonID = $taxonID;
        $this->user = $user;
        $this->name = $name;
    }

    public function handle(): void
    {
        // Update trackable job
        $this->markRunning();

        // Create or find the current shard
        $shard_size = config('gnom.shard_size');
        Log::info('Shard size is '.$shard_size);
        $total_assemblies = Assembly::all()->count();
        $shard_id = floor($total_assemblies / $shard_size) + 1;

        $shard = Shard::where('id', $shard_id)->first();
        if (! $shard) {
            $shard = new Shard;
            $shard->save();
        }

        $assembly = new Assembly;
        $assembly->name = $this->name;
        $assembly->infoText = null;
        $assembly->taxon_ncbiTaxonID = $this->taxonID;
        $assembly->addedBy = $this->user->getAuthIdentifier();
        $assembly->user_id = $this->user->getAuthIdentifier();
        $assembly->public = false;
        $assembly->shard_id = $shard_id;
        $assembly->save();

        $assemblyId = $assembly->id;
        $this->setProgress(20);
        $sourcePath = $this->filepath;
        $targetPath = "taxa/{$this->taxonID}/{$assemblyId}/assembly.fa";

        $vault = Storage::disk('vault');
        $local = Storage::disk('local');

        if ($local->exists($sourcePath)) {
            $targetDir = dirname($targetPath);
            if (! $vault->exists($targetDir)) {
                $vault->makeDirectory($targetDir);
            }

            $sourceFile = fopen($local->path($sourcePath), 'r');
            $targetFile = fopen($vault->path($targetPath), 'w');

            while (($line = fgets($sourceFile)) !== false) {
                if (str_starts_with($line, '>')) {

                    // Strip newline
                    $header = preg_replace('/\R+/', ' ', $line);
                    /**
                     * We append the assemblyID to the FASTA header to make BLAST results differentiable across
                     * assemblies with overlapping sequence identifiers. The | char serves as separator, while the
                     * added space ensures the FASTA ID stays unaltered (this prevents mismatching chromosome IDs in gff
                     * files).
                     */
                    $newHeader = $header.' |'.$assemblyId;
                    fwrite($targetFile, $newHeader."\n");
                } else {
                    fwrite($targetFile, $line);
                }
            }

            fclose($sourceFile);
            fclose($targetFile);
        } else {
            Log::warning("File not found while trying to copy: $sourcePath");
        }
        $this->setProgress(40);
        $stats = $this->parseFasta($targetPath);
        if (isset($stats['error'])) {
            Log::error('Error: '.$stats['error']);
            $this->fail('Failed while assessing assembly stats');
        }

        $assembly->numberOfSequences = $stats['numberOfSequences'];
        $assembly->n50 = $stats['n50'];
        $assembly->n90 = $stats['n90'];
        $assembly->cumulativeSequenceLength = $stats['cumulativeSequenceLength'];
        $assembly->shortestSequence = $stats['shortestSequence'];
        $assembly->longestSequence = $stats['largestSequence'];
        $assembly->medianSequence = $stats['medianSequence'];
        $assembly->meanSequence = $stats['meanSequence'];
        $assembly->gcPercent = $stats['gcPercent'];
        $assembly->gcPercentMasked = $stats['gcPercentMasked'];
        $assembly->lengthDistributionString = $stats['length_distribution'];
        $assembly->update();

        $this->setProgress(60);
        $this->prepareJBrowse("taxa/{$this->taxonID}/{$assemblyId}/");

        $other_imports = UserJob::where('job_class', '\App\Jobs\ImportAssembly')
            ->where('status', '!=', 'completed')
            ->where('status', '!=', 'failed')
            ->where('id', '>', $this->userJobId)
            ->get();

        if ($other_imports->count() == 0) {
            $this->dispatchTrackable('App\Jobs\RebuildBlastShard', [$shard_id], user_id: $this->user->id, queue: 'long');
        }

        $this->user->notify(new ImportCompleted($assemblyId));
        $this->markCompleted(['assemblyID' => $assemblyId]);
    }

    public function prepareJBrowse(string $path): void
    {
        $vault = Storage::disk('vault');

        $gzippedFile = $path.'assembly.fa.gz';
        Log::info("Preparing jBrowse for $gzippedFile");

        $result = Process::run('bgzip '.escapeshellarg($vault->path($path.'assembly.fa')));
        if ($result->failed()) {
            Log::critical('bgzip failed: '.$result->errorOutput());
            $this->fail('Failed while compressing file!');
        }

        $this->filepath = $gzippedFile;

        $result = Process::run('samtools faidx '.escapeshellarg($vault->path($gzippedFile)));
        if ($result->failed()) {
            Log::critical('samtools faidx failed: '.$result->errorOutput());
            $this->fail('Failed while generating FASTA index!');
        }

        $result = Process::run('jbrowse add-assembly '.escapeshellarg($vault->path($gzippedFile)).' --name '.escapeshellarg($this->name).' --load inPlace'.' --target '.$vault->path($path.'config.json'));
        if ($result->failed()) {
            Log::critical('JBrowse Import failed: '.$result->errorOutput());
            $this->fail('Failed while generating JBrowse track config!');
        }
    }

    public function parseFasta(string $filePath)
    {
        $vault = Storage::disk('vault');
        $filePath = $vault->path($filePath);

        if (! file_exists($filePath)) {
            return ['error' => 'File not found '.$filePath];
        }

        $script = base_path('resources/scripts/fasta_parser.pl');
        $result = Process::run("$script \"$filePath\"");

        if ($result->failed()) {
            return ['error' => 'Perl script failed', 'message' => $result->errorOutput()];
        }

        $output = json_decode($result->output(), true);
        if (! $output) {
            Log::error('Failed to parse JSON. Raw output:');
            Log::info($result->output());

            return ['error' => 'Failed to parse JSON'];
        }

        return $output;
    }
}
