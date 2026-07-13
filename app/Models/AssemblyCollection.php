<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssemblyCollection extends Model
{
    //
    protected $table = 'collections';

    public function scopeVisibleTo($query, $user)
    {
        if ($user->role === 'admin') {
            return $query;
        } else {
            return $query->where('user_id', $user->id)->orWhere('is_public', true);
        }
    }

    public function assemblies()
    {
        return $this->belongsToMany(
            Assembly::class,
            'collection_assembly',
            'collection_id',
            'assembly_id'
        );
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
