<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssemblyCollection extends Model
{
    //
    use HasFactory;

    protected $table = 'collections';

    protected $fillable = [
        'name',
        'description',
        'is_public',
        'user_id',
    ];

    public function scopeVisibleTo($query, User | null $user)
    {

        // If the user is unset, we are dealing with a public G-nom Instance
        if (!$user) {
            if (config('gnom.public', false)) {
                return $query->where('is_public', true);
            } else {
                return false;
            }
        }

        if ($user->is_admin) {
            return $query;
        }

        return $query->where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhere('is_public', true)
                ->orWhereHas('users', fn ($q) => $q->whereKey($user->id));
        });
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
        return $this->belongsToMany(
            User::class,
            'collection_user',
            'collection_id',
            'user_id'
        )->withPivot('role');
    }
}
