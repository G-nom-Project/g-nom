<?php

namespace App\Services;
use App\Models\Assembly;
use App\Models\genomicAnnotation;
use App\Models\genomicMapping;
use App\Models\TaxaminerAnalysis;
use App\Models\Taxon;
use App\Models\WiggleTrack;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

class HousekeepingService
{
    /**
     * Helper function, return handle for storage vault.
     * @return Filesystem
     */
    public function getVault(): Filesystem
    {
        return Storage::disk('vault');
    }

    /**
     * Verifies that the data directory of a given taxon ID exists.
     * @param $taxon_id
     * @return array
     */
    public function validateTaxon($taxon_id) {
        $vault = $this->getVault();
        $targetPath = "taxa/{$taxon_id}/";

        if(! $vault->exists($targetPath)) {
            return ['passed' => False, 'message' => "Taxon {$taxon_id} has no taxon directory"];
        }

        return ['passed' => True, 'message' => ""];
    }

    /**
     * Verifies that the compressed FASTA file and its indices associated with a given assembly ID exist.
     * @param $taxon_id
     * @param $assembly_id
     * @return array
     */
    public function validateAssembly($taxon_id, $assembly_id) {
        $vault = $this->getVault();
        $targetPath = "taxa/{$taxon_id}/{$assembly_id}/";

        if(! $vault->exists($targetPath . "assembly.fa.gz")) {
            return ['passed' => False, 'message' => "Assembly FASTA file is missing for id $assembly_id."];
        }

        if(! $vault->exists($targetPath . "assembly.fa.gz.fai")) {
            return ['passed' => False, 'message' => "FASTA index is missing for id $assembly_id."];
        }

        if(! $vault->exists($targetPath . "assembly.fa.gz.gzi")) {
            return ['passed' => False, 'message' => "gzip index is missing for id $assembly_id."];
        }

        return ['passed' => True, 'message' => ""];
    }

    /**
     * Verifies that the compressed GFF file and its indices associated with a given annotation ID exist.
     * @param $taxon_id
     * @param $assembly_id
     * @param $id
     * @param $is_repeatmasker
     * @return array
     */
    public function validateAnnotation($taxon_id, $assembly_id, $id, $is_repeatmasker) {
        $vault = $this->getVault();
        if ($is_repeatmasker) {
            $targetPath = "taxa/{$taxon_id}/{$assembly_id}/annotations/repeatmasker";
        } else {
            $targetPath = "taxa/{$taxon_id}/{$assembly_id}/annotations/{$id}";
        }

        if(! $vault->exists($targetPath . ".sorted.gff3.gz")) {
            return ['passed' => False, 'message' => "Sorted+compressed gff file is missing for id $id assigned to assembly $assembly_id."];
        }

        if(! $vault->exists($targetPath . ".sorted.gff3.gz.tbi")) {
            return ['passed' => False, 'message' => "Index file is missing."];
        }

        return ['passed' => True, 'message' => ""];
    }

    /**
     * Verifies that the BAM file and its indices associated with a given mapping ID exist.
     * @param $taxon_id
     * @param $assembly_id
     * @param $id
     * @return array
     */
    public function validateMapping($taxon_id, $assembly_id, $id) {
        $vault = $this->getVault();
        $targetPath = "taxa/{$taxon_id}/{$assembly_id}/mappings/{$id}";


        if(! $vault->exists($targetPath . ".bam")) {
            return ['passed' => False, 'message' => "BAM file is missing for mapping #$id assigned to assembly $assembly_id."];
        }

        if(! $vault->exists($targetPath . ".bai")) {
            return ['passed' => False, 'message' => "Index file is missing for mapping #$id assigned to assembly $assembly_id."];
        }

        return ['passed' => True, 'message' => ""];
    }

    /**
     * Verifies that the wiggle track associated with a given ID exists.
     * @param $taxon_id
     * @param $assembly_id
     * @param $id
     * @return array
     */
    public function validateWiggle($taxon_id, $assembly_id, $id) {
        $vault = $this->getVault();
        $targetPath = "taxa/{$taxon_id}/{$assembly_id}/wiggle_tracks/{$id}.bw";

        if(! $vault->exists($targetPath)) {
            return ['passed' => False, 'message' => "Wiggle track #$id is missing."];
        }

        return ['passed' => True, 'message' => ""];
    }

    /**
     * Verifies that all required files associated with a given taxaminer analysis exist
     * @param $taxon_id
     * @param $assembly_id
     * @param $id
     * @return array
     */
    public function validateTaxaminer($taxon_id, $assembly_id, $id, ) {
        $vault = $this->getVault();
        $targetPath = "taxa/{$taxon_id}/{$assembly_id}/taxaminerAnalyses/{$id}/";
        $files = [
            'contribution_of_variables.csv',
            'gene_table_taxon_assignment.csv',
            'proteins.faa.gz',
            'proteins.faa.gz.fai',
            'proteins.faa.gz.gzi',
            'summary.txt',
            'taxonomic_hits.txt'
        ];

        foreach ($files as $file) {
            if(! $vault->exists($targetPath . $file)) {
                return ['passed' => False, 'message' => "$file missing for id $id assigned to assembly $assembly_id."];
            }
        }

        return ['passed' => True, 'message' => ""];
    }

    /**
     * This function walks the directories of the storage vault and identifies files which match the canonical paths
     * for a certain object class but have no corresponding database entry.
     * @return array
     */
    public function collectDesyncedFiles() {
        $vault = $this->getVault();
        $taxon_dirs = $vault->directories("taxa/");
        $desynced = [];
        foreach ($taxon_dirs as $taxon_dir) {
            $is_taxon_desynced = False;
            $dir = basename($taxon_dir);
            $taxon_id = intval($dir);

            # Case: Non-numeric or 0 value does not conform to NCBI taxonomy
            if ($taxon_id == 0) {
                $desynced[] = ['dir' => $taxon_dir, 'reason' => 'Non-numeric value'];
                $is_taxon_desynced = True;
            }

            $taxon = Taxon::find($taxon_id);
            # Case: Taxon is not in taxonomy
            if (!$taxon) {
                $desynced[] = ['dir' => $taxon_dir, 'reason' => 'Taxon does not exist'];
                $is_taxon_desynced = True;
            }

            # Case: Taxon has no assigned assemblies
            if ($taxon->assemblies()->count() == 0) {
                $desynced[] = ['dir' => $taxon_dir, 'reason' => 'Taxon has no assemblies in database'];
                $is_taxon_desynced = True;
            }

            # Only proceed with assemblies of taxa which are not desynced
            if (!$is_taxon_desynced) {
                $assembly_dirs = $vault->directories($taxon_dir);
                foreach ($assembly_dirs as $assembly_dir) {
                    $dir = basename($assembly_dir);
                    $assembly_id = intval($dir);
                    $is_assembly_desynced = False;

                    # Case: Non-numeric or 0 value does not conform to naming convention
                    if ($assembly_id == 0) {
                        $desynced[] = ['dir' => $assembly_dir, 'reason' => 'Non-numeric value'];
                        $is_assembly_desynced = True;
                    }

                    $assembly = Assembly::find($assembly_id);
                    # Case: Assembly does not exist
                    if (!$assembly) {
                        $desynced[] = ['dir' => $assembly_dir, 'reason' => 'Assembly no longer exists in database'];
                        $is_assembly_desynced = True;
                    }

                    # Only proceed with assemblies which are not desynced
                    if (!$is_assembly_desynced) {
                        if($vault->exists($assembly_dir . "/annotations")) {
                            $annotations = $vault->files($assembly_dir . "/annotations");

                            foreach ($annotations as $annotation) {
                                $prefix = explode('.', basename($annotation));
                                $annotation_id = intval($prefix[0]);

                                # Case: Non-numeric or 0 value does not conform to naming convention
                                if ($annotation_id == 0 && $prefix[0] != "repeatmasker") {
                                    $desynced[] = ['dir' => $annotation, 'reason' => 'Non-numeric value'];
                                    continue;
                                }

                                if ($prefix[0] == "repeatmasker") {
                                    $db_annotation = genomicAnnotation::where('assembly_id', $assembly_id)->where('name', 'Repeatmasker')->first();
                                } else {
                                    $db_annotation = genomicAnnotation::find($annotation_id);
                                }

                                # Case: Annotation does not exist
                                if (!$db_annotation) {
                                    $desynced[] = ['dir' => $annotation, 'reason' => 'Annotation no longer exists in database'];
                                }
                            }
                        }

                        if($vault->exists($assembly_dir . "/mappings")) {
                            $mappings = $vault->files($assembly_dir . "/mappings");

                            foreach ($mappings as $mapping) {
                                $prefix = explode('.', basename($mapping));
                                $mapping_id = intval($prefix[0]);

                                # Case: Non-numeric or 0 value does not conform to naming convention
                                if ($mapping_id == 0) {
                                    $desynced[] = ['dir' => $mapping, 'reason' => 'Non-numeric value'];
                                    continue;
                                }
                                $db_mapping = genomicMapping::find($mapping_id);
                                # Case: Annotation does not exist
                                if (!$db_mapping) {
                                    $desynced[] = ['dir' => $mapping, 'reason' => 'Mapping no longer exists in database'];
                                }
                            }
                        }

                        # Check for out-of-sync wiggle tracks
                        if($vault->exists($assembly_dir . "/wiggle_tracks")) {
                            $tracks = $vault->files($assembly_dir . "/wiggle_tracks");

                            foreach ($tracks as $track) {
                                $prefix = explode('.', basename($track));
                                $track_id = intval($prefix[0]);

                                # Case: Non-numeric or 0 value does not conform to naming convention
                                if ($track_id == 0) {
                                    $desynced[] = ['dir' => $track, 'reason' => 'Non-numeric value'];
                                    continue;
                                }
                                $db_track = WiggleTrack::find($track_id);
                                # Case: Annotation does not exist
                                if (!$db_track) {
                                    $desynced[] = ['dir' => $track, 'reason' => 'Wiggle Track no longer exists in database'];
                                }
                            }
                        }

                        # Check for taXaminer analyses
                        if($vault->exists($assembly_dir . "/taxaminerAnalyses")) {
                            $taxaminers = $vault->directories($assembly_dir . "/taxaminerAnalyses");

                            foreach ($taxaminers as $taxaminer) {
                                $dir = basename($taxaminer);
                                $taxaminer_id = intval($dir);
                                # Case: Non-numeric or 0 value does not conform to naming convention
                                if ($taxaminer_id == 0) {
                                    $desynced[] = ['dir' => $taxaminer, 'reason' => 'Non-numeric value'];
                                    continue;
                                }

                                # Case: out of sync with DB
                                $taxaminer_db = TaxaminerAnalysis::find($taxaminer_id);
                                if (!$taxaminer_db) {
                                    $desynced[] = ['dir' => $taxaminer, 'reason' => 'Taxaminer analysis no longer exists in database'];
                                }
                            }
                        }
                    }
                }
            }
        }
        return $desynced;
    }

    /**
     * Iterates all database objects which are expected to have corresponding files in the storage vault. Returns
     * objects which do not meet this condition.
     * @return array
     */
    public function collectDesyncedObjects(): array
    {
        $desynced = [];
        # Check taxa with associated assemblies
        $taxa = Taxon::has('assemblies')->get();
        foreach ($taxa as $taxon) {
            $res = $this->validateTaxon($taxon->id);
            if(!$res['passed'])
            {
                $desynced[] = ['object' => 'Taxon', 'id' => $taxon->id, 'reason' => $res['message']];
            }
        }

        # Check all assemblies
        $assemblies = Assembly::all();
        foreach ($assemblies as $assembly) {
            $res = $this->validateAssembly($assembly->taxon_ncbiTaxonID, $assembly->id);
            if(!$res['passed'])
            {
                $desynced[] = ['object' => 'Assembly', 'id' => $assembly->id, 'reason' => $res['message']];
            }
        }

        # Check all annotations
        $annotations = genomicAnnotation::with('assembly')->get();
        foreach ($annotations as $annotation) {
            $res = $this->validateAnnotation($annotation->assembly->taxon_ncbiTaxonID, $annotation->assembly->id, $annotation->id, $annotation->name == "Repeatmasker");
            if(!$res['passed'])
            {
                $desynced[] = ['object' => 'Annotation', 'id' => $annotation->id, 'reason' => $res['message']];
            }
        }

        # Check all mappings
        $mappings = genomicMapping::with('assembly')->get();
        foreach ($mappings as $mapping) {
            $res = $this->validateMapping($mapping->assembly->taxon_ncbiTaxonID, $mapping->assembly->id, $mapping->id);
            if(!$res['passed'])
            {
                $desynced[] = ['object' => 'Mapping', 'id' => $mapping->id, 'reason' => $res['message']];
            }
        }

        # Check all mappings
        $tracks = WiggleTrack::with('assembly')->get();
        foreach ($tracks as $track) {
            $res = $this->validateWiggle($track->assembly->taxon_ncbiTaxonID, $track->assembly->id, $track->id);
            if(!$res['passed'])
            {
                $desynced[] = ['object' => 'Wiggle Track', 'id' => $track->id, 'reason' => $res['message']];
            }
        }

        # Check all mappings
        $analyses = TaxaminerAnalysis::with('assembly')->get();
        foreach ($analyses as $analysis) {
            $res = $this->validateTaxaminer($analysis->assembly->taxon_ncbiTaxonID, $analysis->assembly->id, $analysis->id);
            if(!$res['passed'])
            {
                $desynced[] = ['object' => 'taXaminer analysis', 'id' => $analysis->id, 'reason' => $res['message']];
            }
        }
        return $desynced;
    }
}
