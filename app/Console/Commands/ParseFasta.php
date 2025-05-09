<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class ParseFasta extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fasta:parse {path}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->argument('path');

        if (!file_exists($path)) {
            $this->error("File not found: $path");
            return 1;
        }

        $script = base_path('resources/scripts/fasta_parser.pl');
        $result = Process::run("$script \"$path\"");

        if ($result->failed()) {
            $this->error("Error running script:\n" . $result->errorOutput());
            return 1;
        }

        $output = json_decode($result->output(), true);
        if (!$output) {
            $this->error("Failed to parse JSON. Raw output:");
            $this->line($result->output());  // 👈 Print the raw output from the script
            return 1;
        }
        $this->info("Sequence type: " . $output['sequenceType']);
        $this->info("Total length: " . $output['cumulativeSequenceLength']);
        return 0;
    }
}
