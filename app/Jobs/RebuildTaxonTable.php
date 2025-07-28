<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class RebuildTaxonTable implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userID;
    public $timeout = 120;

    public function __construct(int $userID)
    {
        $this->userID = $userID;
    }

    public function handle(): void
    {
        $local = Storage::disk('local');
        $namesPath = $local->path("/uploads/taxdump/names.dmp");
        $nodesPath = $local->path("/uploads/taxdump/nodes.dmp");

        try {
            $taxonData = file($namesPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $nodeData = file($nodesPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        } catch (\Exception $e) {
            Log::error("File read error: " . $e->getMessage());
            return;
        }

        DB::beginTransaction();

        try {
            // 1. Drop + recreate staging table
            DB::statement("DROP TABLE IF EXISTS taxa_staging");
            DB::statement("DROP TABLE IF EXISTS taxa_old");
            DB::statement("CREATE TABLE taxa_staging (LIKE taxa INCLUDING ALL);");

            $values = [];
            $counter = 0;
            $scientificName = '';
            $commonName = '';

            foreach ($taxonData as $index => $line) {
                $taxonSplit = explode("\t", $line);
                $currentTaxonID = (int)$taxonSplit[0];

                if (str_contains($line, 'scientific name')) {
                    $scientificName = str_replace("'", "", $taxonSplit[2]);
                }

                if (str_contains($line, 'genbank common name')) {
                    $commonName = str_replace("'", "", $taxonSplit[2]);
                }

                $nextID = isset($taxonData[$index + 1]) ? (int)explode("\t", $taxonData[$index + 1])[0] : null;

                if ($nextID !== $currentTaxonID) {
                    if (empty($scientificName)) {
                        throw new \Exception("Missing scientific name for taxon ID $currentTaxonID");
                    }

                    $nodeSplit = explode("\t", $nodeData[$counter] ?? '');

                    if ((int)($nodeSplit[0] ?? -1) !== $currentTaxonID) {
                        throw new \Exception("Mismatched node data for taxon ID $currentTaxonID at index $counter");
                    }

                    $parentTaxonID = (int)$nodeSplit[2];
                    $rank = str_replace("'", "", $nodeSplit[4] ?? '');
                    $now = now();
                    $values[] = [
                        'ncbiTaxonID' => $currentTaxonID,
                        'parentNcbiTaxonID' => $parentTaxonID,
                        'scientificName' => $scientificName,
                        'taxonRank' => $rank,
                        'commonName' => $commonName,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    $scientificName = '';
                    $commonName = '';
                    $counter++;

                    if ($counter % 5000 === 0) {
                        usort($values, fn($a, $b) => $a['ncbiTaxonID'] <=> $b['ncbiTaxonID']);
                        DB::table('taxa_staging')->insert($values);
                        $values = [];
                    }
                }
            }

            if (!empty($values)) {
                usort($values, fn($a, $b) => $a['ncbiTaxonID'] <=> $b['ncbiTaxonID']);
                DB::table('taxa_staging')->insert($values);
            }

            // Swap tables
            DB::statement("ALTER TABLE taxa RENAME TO taxa_old");
            DB::statement("ALTER TABLE taxa_staging RENAME TO taxa");
            DB::commit();

            $count = DB::table('taxa')->count();
            Log::info("Success: $count taxa imported.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Taxa import failed: " . $e->getMessage());
        }
    }
}
