<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxonGeoData extends Model
{
    //
    protected $table = 'taxon_geo_data';

    public function taxon()
    {
        return $this->belongsTo(Taxon::class, 'taxonID', 'ncbiTaxonID');
    }
}
