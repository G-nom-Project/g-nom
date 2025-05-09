<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Taxon extends Model
{
    protected $table = 'taxa';
    //
    public function assemblies()
    {
        return $this->hasMany(Assembly::class, 'taxon_id', 'ncbiTaxonID');
    }

    public function infos()
    {
        return $this->hasMany(TaxonGeneralInfo::class);
    }
}
