<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class genomicAnnotation extends Model
{
    //
    use HasFactory;

    protected $table = 'genomic_annotations';

    public function feature()
    {
        return $this->hasMany(genomicAnnotationFeature::class);
    }

    public function assembly()
    {
        return $this->belongsTo(Assembly::class, 'id');
    }
}
