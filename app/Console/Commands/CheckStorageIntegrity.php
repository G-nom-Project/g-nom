<?php

namespace App\Console\Commands;
use App\Services\HousekeepingService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:check-storage-integrity')]
#[Description('Identifies files in storage which are out-of-sync with the database and database objects which are
out-of-sync with the stored files. This command does NOT automatically resolve the highlighted issues.')]
class CheckStorageIntegrity extends Command
{

    /**
     * Execute the console command.
     */
    public function handle(HousekeepingService $housekeeping)
    {
        # Check for files database without corresponding database entries
        $this->info('=> Desynced files');
        $desynced = $housekeeping->collectDesyncedFiles();
        if (count($desynced) > 0) {
            foreach ($desynced as $taxon) {
                $this->warn($taxon['dir'] . " -> " . $taxon['reason']);
            }
        } else {
            $this->info('No desynced files');
        }
        $this->info("=> " . count($desynced) . " total");
        $this->newLine();

        # Check for entries in the database without corresponding files
        $this->info('=> Desynced database objects');
        $desynced_objects = $housekeeping->collectDesyncedObjects();
        if (count($desynced_objects) > 0) {
            foreach ($desynced_objects as $object) {
                $this->warn($object['object'] . " #" . $object['id'] . " -> " . $object['reason']);
            }
        } else {
            $this->info('No desynced objects');
        }
        $this->info("=> " . count($desynced_objects) . " total");
    }
}
