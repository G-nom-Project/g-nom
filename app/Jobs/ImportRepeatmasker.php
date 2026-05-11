<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Models\RepeatmaskerAnalysis;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class ImportRepeatmasker extends TrackableJob
{
    use Queueable;

    protected string $filepath;

    protected int $assemblyID;

    protected int $taxonID;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userJobId, $filepath, $assemblyID, $taxonID)
    {

        parent::__construct($userJobId);
        //
        $this->filepath = $filepath;
        $this->assemblyID = $assemblyID;
        $this->taxonID = $taxonID;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->markRunning();

        $local = Storage::disk('local');
        $sourcePath = $local->path($this->filepath.'.tbl');

        if (! file_exists($sourcePath)) {
            throw new \RuntimeException("RepeatMasker file not found: {$sourcePath}");
        }

        try {
            $lines = file($sourcePath);

            $result = new RepeatmaskerAnalysis;
            if ($this->assemblyID) {
                $result->assembly_id = $this->assemblyID;
            }

            $totalSequenceLength = 0;
            $remainingSequenceLength = 0;

            $repeatMap = [
                'sines' => ['sines', 'sines_length'],
                'lines' => ['lines', 'lines_length'],
                'ltr elements' => ['ltr_elements', 'ltr_elements_length'],
                'dna transposons' => ['dna_elements', 'dna_elements_length'],
                'dna elements' => ['dna_elements', 'dna_elements_length'],
                'unclassified' => ['unclassified', 'unclassified_length'],
                'rolling-circles' => ['rolling_circles', 'rolling_circles_length'],
                'small rna' => ['small_rna', 'small_rna_length'],
                'satellites' => ['satellites', 'satellites_length'],
                'simple repeats' => ['simple_repeats', 'simple_repeats_length'],
                'low complexity' => ['low_complexity', 'low_complexity_length'],
            ];

            foreach ($lines as $line) {
                if ($line === '' || $line[0] === '=' || $line[0] === '-') {
                    continue;
                }

                preg_match_all('/[\d.]+/', $line, $matches);
                $values = $matches[0];

                if (empty($values)) {
                    continue;
                }

                $lineLower = strtolower($line);
                if (str_contains($lineLower, 'total length')) {
                    $totalSequenceLength = (int) $values[0];
                    $remainingSequenceLength = $totalSequenceLength;

                    continue;
                }

                if (str_contains($lineLower, 'bases masked')) {
                    $result->numberN = (int) $values[0];
                    $result->percentN = (float) ($values[1] ?? 0);

                    continue;
                }

                foreach ($repeatMap as $label => $fields) {
                    if (! str_contains($lineLower, $label)) {
                        continue;
                    }

                    $count = (int) $values[0];
                    $length = (int) ($values[1] ?? 0);

                    $result->{$fields[0]} = $count;
                    $result->{$fields[1]} = $length;

                    $remainingSequenceLength -= $length;

                    break;
                }
            }

            if ($totalSequenceLength === 0) {
                throw new \RuntimeException('Invalid RepeatMasker file: total length = 0');
            }

            $result->total_non_repetitive_length = $remainingSequenceLength;
            $result->total_non_repetitive_length_percent = $remainingSequenceLength / $totalSequenceLength;
            $result->total_repetitive_length = $totalSequenceLength - $remainingSequenceLength;
            $result->total_repetitive_length_percent =
                ($totalSequenceLength - $remainingSequenceLength) / $totalSequenceLength;

            $result->save();

        } catch (\Throwable $e) {
            throw $e;
        }

        // External process
        $script = base_path('resources/scripts/rm_to_gff.pl');
        $input = file_get_contents($local->path($this->filepath).'.out');
        $process = Process::timeout(600)
            ->input($input)
            ->run($script);

        if ($process->failed()) {
            throw new \RuntimeException('GFF conversion failed');
        }

        file_put_contents($sourcePath.'.gff', $process->output());

        $this->markCompleted([]);
    }

    public function failed(\Throwable $e): void
    {
        $this->markFailed($e);
    }
}
