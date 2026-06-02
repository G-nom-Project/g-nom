<?php

namespace App\Models;

use App\Services\RdfService;
use Illuminate\Database\Eloquent\Model;

class Assembly extends Model
{
    //
    protected $table = 'assemblies';

    /**
     * Limit visibility to public assemblies or assemblies owned by a user
     *
     * @param  $user  User
     * @return mixed
     */
    public function scopeVisibleTo($query, $user)
    {
        if ($user->role === 'admin') {
            return $query;
        } else {
            return $query->where('user_id', $user->id)->orWhere('public', true);
        }
    }

    public function mappings()
    {
        return $this->hasMany(genomicMapping::class);
    }

    public function genomicAnnotations()
    {
        return $this->hasMany(genomicAnnotation::class);
    }

    public function buscoAnalyses()
    {
        return $this->hasMany(BuscoAnalysis::class);
    }

    public function repeatmaskerAnalyses()
    {
        return $this->hasMany(RepeatmaskerAnalysis::class);
    }

    public function fcatAnalyses()
    {
        return $this->hasMany(FcatAnalysis::class);
    }

    public function taxaminerAnalyses()
    {
        return $this->hasMany(TaxaminerAnalysis::class);
    }

    public function taxon()
    {
        return $this->belongsTo(Taxon::class, 'taxon_ncbiTaxonID', 'ncbiTaxonID');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class, 'assembly_id');
    }

    public function shard()
    {
        return $this->belongsTo(Shard::class);
    }

    public function toRdfRecord(RdfService $rdf)
    {
        $subject = $rdf->assemblyUri($this->id);
        $triples = [];
        // Triple: Type
        $triples[] = $rdf->tripleUri(
            $subject,
            "{$rdf->rdf}type",
            "{$rdf->gnom}Assembly"
        );
        // Triple: Internal ID
        $triples[] = $rdf->tripleLiteral(
            $subject,
            "{$rdf->gnom}id",
            $this->id,
            "{$rdf->xsd}integer"
        );
        // Triple: Label
        if ($this->name !== null) {
            $name = $rdf->escapeLiteral($this->name);
            $triples[] = $rdf->tripleLiteral(
                $subject,
                "{$rdf->rdfs}label",
                $name
            );
        }
        // Triple: Taxon
        if ($this->taxon_ncbiTaxonID !== null) {
            $triples[] = $rdf->tripleUri(
                $subject,
                "{$rdf->gnom}in_taxon",
                $rdf->taxonUri($this->taxon_ncbiTaxonID)
            );
        }

        return $triples;
    }
}
