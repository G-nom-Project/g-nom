<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxonGeneralInfo extends Model
{
    protected $table = 'taxon_general_infos';
    protected $primaryKey = 'ncbiTaxonID';
    //
    public function taxon()
    {
        return $this->belongsTo(Taxon::class, 'ncbiTaxonID', 'ncbiTaxonID');
    }
}
