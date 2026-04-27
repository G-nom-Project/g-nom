<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shard extends Model
{
    //
    protected $table = 'shards';

    public function assemblies()
    {
        return $this->hasMany(Assembly::class);
    }
}
