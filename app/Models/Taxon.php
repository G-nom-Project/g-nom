<?php

namespace App\Models;

use App\Services\RdfService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Taxon extends Model
{
    use HasFactory;

    protected $table = 'taxa';

    protected $primaryKey = 'ncbiTaxonID';

    public $incrementing = false;

    //
    public function assemblies()
    {
        return $this->hasMany(Assembly::class, 'taxon_ncbiTaxonID', 'ncbiTaxonID');
    }

    public function infos()
    {
        return $this->hasMany(TaxonGeneralInfo::class, 'ncbiTaxonID', 'ncbiTaxonID');
    }

    public function geoData()
    {
        return $this->hasMany(TaxonGeoData::class, 'taxonID', 'ncbiTaxonID');
    }

    public function toRdfRecord(RdfService $rdf): array
    {
        $triples = [];

        $subject = $rdf->taxonUri($this->ncbiTaxonID);

        /*
        -------------------------------------------------
        TYPE
        -------------------------------------------------
        */

        $triples[] = $rdf->tripleUri(
            $subject,
            "{$rdf->rdf}type",
            "{$rdf->biolink}OrganismTaxon"
        );

        if ($this->scientificName !== null) {
            $name = $rdf->escapeLiteral($this->scientificName);

            $triples[] = $rdf->tripleLiteral(
                $subject,
                "{$rdf->rdfs}label",
                $name
            );
        }

        /*
        -------------------------------------------------
        TAXON HIERARCHY
        -------------------------------------------------
        */

        if ($this->parentNcbiTaxonID !== null) {
            $triples[] = $rdf->tripleUri(
                $subject,
                "{$rdf->gnom}parent_taxon",
                $rdf->taxonUri($this->parentNcbiTaxonID)
            );
        }

        return $triples;
    }
}
