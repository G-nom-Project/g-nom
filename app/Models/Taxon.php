<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Taxon extends Model
{
    protected $table = 'taxa';
    protected $primaryKey = 'ncbiTaxonID';
    public $incrementing = false;
    //
    public function assemblies()
    {
        return $this->hasMany(Assembly::class, 'taxon_id', 'ncbiTaxonID');
    }

    public function infos()
    {
        return $this->hasMany(TaxonGeneralInfo::class, 'ncbiTaxonID', 'ncbiTaxonID');
    }

    public function geoData()
    {
        return $this->hasMany(TaxonGeoData::class, 'taxonID', 'ncbiTaxonID');
    }


}
