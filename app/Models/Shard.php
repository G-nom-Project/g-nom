<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shard extends Model
{
    use HasFactory;

    //
    protected $table = 'shards';

    public function assemblies()
    {
        return $this->hasMany(Assembly::class);
    }
}
