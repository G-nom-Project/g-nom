<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    protected $fillable = [
        'title',
        'abstract',
        'authors',
        'file_path',
        'file_hash',
        'chunk_index',
        'content',
        'section',
        'metadata',
        'doi',
    ];

    protected $casts = [
        'authors' => 'array',
    ];

    public function elements(): HasMany
    {
        return $this->hasMany(DocumentElement::class)
            ->orderBy('position');
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(DocumentChunk::class)
            ->orderBy('chunk_index');
    }

    public function references(): HasMany
    {
        return $this->hasMany(DocumentReference::class);
    }

}
