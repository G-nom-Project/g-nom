<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assembly extends Model
{
    //
    protected $table = 'assemblies';
    //protected $primaryKey = 'assembly_id';

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
        return $this->belongsTo(Taxon::class, 'taxon_id', 'ncbiTaxonID');
    }
}
