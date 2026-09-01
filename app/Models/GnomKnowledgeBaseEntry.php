<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Ai\Embeddings;

/**
 * Based off https://github.com/harris21/ship-ai-with-laravel/commit/0e03ba53336c07e6786971ae0361664cf97bd138
 */
class GnomKnowledgeBaseEntry extends Model
{
    protected $fillable = [
        'title',
        'content',
        'category',
        'embedding',
    ];

    protected $table = 'gnom_knowledgebase_entries';

    protected function casts(): array
    {
        return [
            'embedding' => 'array',
        ];
    }

    public function generateEmbedding(): void
    {
        $text = "{$this->title}\n\n{$this->content}";


        $response = Embeddings::for([$text])
            ->dimensions(config('ai.context_sizes.embeddings.result', 1024))
            ->generate();

        $this->update(['embedding' => $response->embeddings[0]]);
    }
}
