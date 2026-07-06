<?php

namespace App\Models;

use App\Services\RdfService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TaxaminerAnalysis extends Model
{
    //
    use HasFactory;

    public function assembly()
    {
        return $this->belongsTo(Assembly::class, 'assembly_id', 'id');
    }

    public function toRdfRecord(RdfService $rdf): array
    {
        $triples = [];

        $analysis = $rdf->taxaminerUri($this->id);

        /*
        -------------------------------------------------
        ANALYSIS NODE
        -------------------------------------------------
        */

        $triples[] = $rdf->tripleUri(
            $analysis,
            "{$rdf->rdf}type",
            "{$rdf->gnom}TaxaminerAnalysis"
        );

        if ($this->name !== null) {
            $triples[] = $rdf->tripleLiteral(
                $analysis,
                "{$rdf->rdfs}label",
                $rdf->escapeLiteral($this->name)
            );
        }

        if ($this->assembly_id !== null) {
            $triples[] = $rdf->tripleUri(
                $analysis,
                "{$rdf->gnom}in_assembly",
                $rdf->assemblyUri($this->assembly_id)
            );
        }

        $vault = Storage::disk('vault');
        $assembly = $this->assembly;

        $filePath = $vault->path(
            "taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/taxaminerAnalyses/{$this->id}/gene_table_taxon_assignment.csv"
        );

        if (! file_exists($filePath)) {
            return $triples;
        }

        $file = fopen($filePath, 'r');
        $headers = fgetcsv($file, 0);

        while (($row = fgetcsv($file, 0)) !== false) {

            $data = array_combine($headers, $row);

            if (($data['plot_label'] ?? null) === 'Unassigned') {
                continue;
            }

            $assignment = $rdf->geneAssignmentUri(
                $this->id,
                $data['g_name']
            );

            $triples[] = $rdf->tripleUri(
                $assignment,
                "{$rdf->rdf}type",
                "{$rdf->gnom}GeneTaxonomicAssignment"
            );

            $triples[] = $rdf->tripleUri(
                $assignment,
                "{$rdf->gnom}in_taxon",
                $rdf->taxonUri($data['taxon_assignmentID'])
            );

            $triples[] = $rdf->tripleLiteral(
                $assignment,
                "{$rdf->gnom}fasta_header",
                $data['fasta_header']
            );

            $triples[] = $rdf->tripleUri(
                $assignment,
                "{$rdf->gnom}emitter",
                $analysis
            );
        }

        fclose($file);

        return $triples;
    }
}
