<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentChunk extends Model
{
    protected $table = 'document_chunks';
    protected $fillable = [
        'document_id',
        'chunk_index',
        'content',
        'section',
        'section_path',
        'page_start',
        'page_end',
        'token_count',
        'metadata',
        'embedding',
    ];

    protected $casts = [
        'section_path' => 'array',
        'metadata' => 'array',
        'embedding' => 'array',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
