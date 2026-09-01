<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentReference extends Model
{
    protected $fillable = [
        'document_id',
        'reference_id',
        'type',
        'content',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

}
