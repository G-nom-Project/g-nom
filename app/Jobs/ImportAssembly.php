<?php

namespace App\Jobs;

use App\Models\Assembly;
use App\Notifications\ImportCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ImportAssembly implements ShouldQueue
{
    use Queueable;

    protected string $filepath;
    protected int $taxonID;
    protected string $name;
    protected $user;

    public function __construct(string $filepath, int $taxonID, string $name, $user)
    {
        $this->filepath = $filepath;
        $this->taxonID = $taxonID;
        $this->user = $user;
        $this->name = $name;
    }

    public function handle(): void
    {
        $assembly = new Assembly();
        $assembly->name = $this->name;
        $assembly->infoText = null;
        $assembly->taxon_id = $this->taxonID;
        $assembly->addedBy = $this->user->getAuthIdentifier();
        $assembly->public = false;
        $assembly->save();

        $assemblyId = $assembly->id;

        $sourcePath = $this->filepath;
        $targetPath = "taxa/{$this->taxonID}/{$assemblyId}/assembly.fa";

        $vault = Storage::disk('vault');
        $local = Storage::disk('local');

        if ($local->exists($sourcePath)) {
            $targetDir = dirname($targetPath);
            if (!$vault->exists($targetDir)) {
                $vault->makeDirectory($targetDir);
            }

            $sourceFile = fopen($local->path($sourcePath), 'rb');
            $targetFile = fopen($vault->path($targetPath), 'wb');

            while (!feof($sourceFile)) {
                $buffer = fread($sourceFile, 1024);
                fwrite($targetFile, $buffer);
            }

            fclose($sourceFile);
            fclose($targetFile);
        } else {
            Log::warning("File not found while trying to copy: $sourcePath");
        }

        $stats = $this->parseFasta($targetPath);
        if (isset($stats['error'])) {
            Log::error("Error: " . $stats['error']);
            $this->fail("Failed while assessing assembly stats");
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

        $this->prepareJBrowse("taxa/{$this->taxonID}/{$assemblyId}/");

        $this->user->notify(new ImportCompleted($assemblyId));
    }

    public function prepareJBrowse(string $path): void
    {
        $vault = Storage::disk('vault');

        $gzippedFile = $path . 'assembly.fa.gz';
        Log::info("Preparing jBrowse for $gzippedFile");

        $result = Process::run("bgzip " . escapeshellarg($vault->path($path . "assembly.fa")));
        if ($result->failed()) {
            Log::critical("bgzip failed: " . $result->errorOutput());
            $this->fail("Failed while compressing file!");
        }

        $this->filepath = $gzippedFile;

        $result = Process::run("samtools faidx " . escapeshellarg($vault->path($gzippedFile)));
        if ($result->failed()) {
            Log::critical("samtools faidx failed: " . $result->errorOutput());
            $this->fail("Failed while generating FASTA index!");
        }

        $result = Process::run("jbrowse add-assembly " . escapeshellarg($vault->path($gzippedFile)) . " --name " . escapeshellarg($this->name) . " --load inPlace" . " --target " . $vault->path($path . "config.json"));
        if ($result->failed()) {
            Log::critical("JBrowse Import failed: " . $result->errorOutput());
            $this->fail("Failed while generating JBrowse track config!");
        }
    }

    public function parseFasta(string $filePath)
    {
        $vault = Storage::disk('vault');
        $filePath = $vault->path($filePath);

        if (!file_exists($filePath)) {
            return ['error' => 'File not found ' . $filePath];
        }

        $script = base_path('resources/scripts/fasta_parser.pl');
        $result = Process::run("$script \"$filePath\"");

        if ($result->failed()) {
            return ['error' => 'Perl script failed', 'message' => $result->errorOutput()];
        }

        $output = json_decode($result->output(), true);
        if (!$output) {
            Log::error("Failed to parse JSON. Raw output:");
            Log::info($result->output());
            return ['error' => 'Failed to parse JSON'];
        }

        return $output;
    }
}
