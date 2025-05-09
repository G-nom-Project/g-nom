<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bookmark extends Model
{
    /** @use HasFactory<\Database\Factories\BookmarkFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'assembly_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class, "assembly_id", "id");
    }
}
