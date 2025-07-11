<?php

namespace App\Console\Commands;

use App\Jobs\RebuildTaxonTable;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;
use Illuminate\Support\Facades\Storage;
use PharData;

class RebuildTaxaDatabase extends Command implements Isolatable
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:rebuild-taxa-database {taxdmp-url : URL to fetch taxdmp.tar.gz file. Usually https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/new_taxdump.tar.gz}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Download the newest taxdump and update the local database.';

    /**
     * Execute the console command.
     * @throws \Throwable
     */
    public function handle()
    {
        // Use Local Disk here
        $local = Storage::disk('local');

        //Download new taxdump
        $this->info("Downloading...");
        $result = file_put_contents($local->path("/uploads/taxdump.tar.gz"), file_get_contents($this->argument('taxdmp-url')));
        if (!$result) {
            $this->fail("Failed to write taxdmp.tar.gz file.");
        } else {
            $this->info("Downloaded {$result} Bytes");
        }

        // Unpack taxdump
        $this->info("Unpacking taxdump...");
        try {
            $phar = new PharData($local->path("/uploads/taxdump.tar.gz"));
            $phar->extractTo($local->path("/uploads/taxdump"), overwrite: true);
        } catch (Exception $e) {
            $this->fail("Failed to unpack taxdmp.tar.gz file: {$e}");
        }

        // Dispatch database import job
        $this->info("Dispatching Import job...");
        RebuildTaxonTable::dispatch(1);
        $this->info("Dispatched import job, database will be imported asynchronously. This may up to 5 minutes.");
    }
}
