<?php

namespace App\Jobs;

use App\Models\BuscoAnalysis;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ImportBusco implements ShouldQueue
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
    public function __construct(string $filepath, int $assemblyID, int $taxonID, string $name, $user)
    {
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
        // Storage definitions
        $vault = Storage::disk('vault');
        $local = Storage::disk('local');
        $sourcePath = $local->path($this->filepath);

        Log::info('Attempting to parse BUSCO data at '.$sourcePath);
        $stats = $this->parseBusco($sourcePath);
        if (isset($stats['error'])) {
            Log::error('Error: '.$stats['error']);
            $this->fail('Failed while assessing assembly stats');
        }

        $analysis = new BuscoAnalysis;
        $analysis->assembly_id = $this->assemblyID;
        $analysis->name = $this->name;
        $analysis->completeSingle = $stats['completeSingle'];
        $analysis->completeDuplicated = $stats['completeDuplicated'];
        $analysis->fragmented = $stats['fragmented'];
        $analysis->missing = $stats['missing'];
        $analysis->total = $stats['total'];
        $analysis->completeSinglePercent = $stats['completeSinglePercent'];
        $analysis->completeDuplicatedPercent = $stats['completeDuplicatedPercent'];
        $analysis->fragmentedPercent = $stats['fragmentedPercent'];
        $analysis->missingPercent = $stats['missingPercent'];
        $analysis->dataset = $stats['dataset'];
        $analysis->buscoMode = $stats['buscoMode'];
        $analysis->save();

        $analysisID = $analysis->id;
        $targetPath = "taxa/{$this->taxonID}/{$this->assemblyID}/analyses/BUSCO/{$analysisID}_summary.txt";

        // Move file
        if ($local->exists($sourcePath)) {
            $targetDir = dirname($targetPath);
            if (! $vault->exists($targetDir)) {
                $vault->makeDirectory($targetDir);
            }

            // Save file
            Storage::disk('vault')->put($targetPath, $local->get($this->filepath));
        }

        $analysis->targetFile = $stats['targetFile'];
        $analysis->update();
    }

    public function parseBusco(string $filePath)
    {

        if (! file_exists($filePath)) {
            return ['error' => 'File not found '.$filePath];
        }

        $script = base_path('resources/scripts/parse_busco.pl');
        Log::info("$script \"$filePath\"");
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
        Log::info($output);

        return $output;
    }

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("status:{$this->assemblyID}"))->shared(),
        ];
    }
}
