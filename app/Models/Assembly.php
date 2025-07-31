<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assembly extends Model
{
    //
    protected $table = 'assemblies';

    /**
     * Limit visibility to public assemblies or assemblies owned by a user
     * @param $query
     * @param $user User
     * @return mixed
     */
    public function scopeVisibleTo($query, $user)
    {
        if ($user-> role === "admin") {
            return $query;
        } else {
            return $query->where('owner', $user->id)->orWhere('public', true);
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
        return $this->belongsTo(Taxon::class, 'taxon_id', 'ncbiTaxonID');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
