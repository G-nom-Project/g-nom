<?php

namespace App\Console\Commands;

use App\Jobs\RebuildTaxonTable;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;

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
     *
     * @throws \Throwable
     */
    public function handle()
    {
        // Dispatch database import job
        $this->info('Dispatching Import job...');
        RebuildTaxonTable::dispatch(1, $this->argument('taxdmp-url'));
        $this->info('Dispatched import job, database will be imported asynchronously. This may up to 5 minutes.');
    }
}
