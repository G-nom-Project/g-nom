<?php

namespace App\Models;

use App\Services\RdfService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assembly extends Model
{
    //
    use HasFactory;

    protected $table = 'assemblies';

    protected $casts = [
        'lengthDistributionString' => 'array',
        'coverage' => 'array',
        'charCount' => 'array',
    ];

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

    public function wiggleTracks()
    {
        return $this->hasMany(WiggleTrack::class);
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

    public function toRdfRecord(RdfService $rdf): array
    {
        $subject = $rdf->assemblyUri($this->id);
        $triples = [];

        $triples[] = $rdf->tripleUri(
            $subject,
            "{$rdf->rdf}type",
            "{$rdf->gnom}Assembly"
        );

        if ($this->name !== null) {
            $triples[] = $rdf->tripleLiteral(
                $subject,
                "{$rdf->rdfs}label",
                $rdf->escapeLiteral($this->name)
            );
        }

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
