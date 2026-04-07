<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxaminerAnalysis extends Model
{
    //
    public function assembly()
    {
        $this->belongsTo(Assembly::class, 'assembly_id', 'id');
    }
}
