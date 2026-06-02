<?php

namespace App\Models;

use App\Services\RdfService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TaxaminerAnalysis extends Model
{
    //
    public function assembly()
    {
        return $this->belongsTo(Assembly::class, 'assembly_id', 'id');
    }

    public function toRdfRecord(RdfService $rdf): array
    {
        $subject = $rdf->taxaminerUri($this->id);
        $triples = [];

        $triples[] = $rdf->tripleUri(
            $subject,
            "{$rdf->rdf}type",
            "{$rdf->gnom}TaxaminerAnalysis"
        );

        $triples[] = $rdf->tripleLiteral(
            $subject,
            "{$rdf->gnom}id",
            $this->id,
            "{$rdf->xsd}integer"
        );

        if ($this->name !== null) {
            $name = $rdf->escapeLiteral($this->name);
            $triples[] = $rdf->tripleLiteral(
                $subject,
                "{$rdf->rdfs}label",
                $name
            );
        }

        if ($this->assembly_id !== null) {
            $triples[] = $rdf->tripleUri(
                $subject,
                "{$rdf->gnom}in_assembly",
                $rdf->assemblyUri($this->assembly_id)
            );
        }

        $vault = Storage::disk('vault');
        $assembly = $this->assembly;
        $file = fopen($vault->path("taxa/{$assembly->taxon_ncbiTaxonID}/{$assembly->id}/taxaminerAnalyses/{$this->id}/gene_table_taxon_assignment.csv"), 'r');
        $headers = fgetcsv($file, 0);

        while (($row = fgetcsv($file, 0)) !== false) {
            $data = array_combine($headers, $row);
            if ($data['plot_label'] != 'Unassigned') {
                $subject = $rdf->assignmentUri($this->id.'-'.$data['g_name']);
                $triples[] = $rdf->tripleUri(
                    $subject,
                    "{$rdf->rdf}type",
                    "{$rdf->gnom}GeneTaxonomicAssignment"
                );

                $triples[] = $rdf->tripleLiteral(
                    $subject,
                    "{$rdf->gnom}id",
                    $this->id.'-'.$data['g_name'],
                    "{$rdf->xsd}string"
                );

                $triples[] = $rdf->tripleUri(
                    $subject,
                    "{$rdf->gnom}in_taxon",
                    $rdf->taxonUri($data['taxon_assignmentID'])
                );

                $triples[] = $rdf->tripleUri(
                    $subject,
                    "{$rdf->gnom}emitter",
                    $rdf->taxaminerUri($this->id),
                );
            }
        }

        return $triples;
    }
}
