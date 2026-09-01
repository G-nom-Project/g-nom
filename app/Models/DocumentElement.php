<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentElement extends Model
{
    protected $fillable = [
        'document_id',
        'position',
        'type',
        'section',
        'section_path',
        'content',
        'label',
        'metadata',
        'page_start',
        'page_end',
    ];

    protected $casts = [
        'section_path' => 'array',
        'metadata' => 'array',
        'page_start' => 'integer',
        'page_end' => 'integer',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
