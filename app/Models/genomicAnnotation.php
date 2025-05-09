<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class genomicAnnotation extends Model
{
    //
    protected $table = 'genomic_annotations';

    public function feature()
    {
        return $this->hasMany(genomicAnnotationFeature::class);
    }
}
