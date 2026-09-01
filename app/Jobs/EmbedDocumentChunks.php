<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Embeddings;

class EmbedDocumentChunks implements ShouldQueue
{
    use Queueable;
    private int $batchSize = 32;

    public function __construct(
        public int $documentId,
    ) {}

    public function embed(Document $document): void
    {
        $document->chunks()
            ->whereNull('embedding')
            ->orderBy('chunk_index')
            ->chunkById(
                $this->batchSize,
                function ($chunks) {
                    $this->embedBatch($chunks);
                }
            );
    }

    private function embedBatch($chunks): void
    {
        $texts = $chunks
            ->map(fn($chunk) => $chunk->content)
            ->values()
            ->all();

        $response = Embeddings::for($texts)
            ->dimensions(1024)
            ->generate();

        foreach (
            $chunks->values() as $index => $chunk
        ) {
            $embedding = $response->embeddings[$index];
            Log::info(sizeof($embedding));

            $chunk->update([
                'embedding' => $embedding,
            ]);
        }
    }

    public function handle(): void {
        $document = Document::findOrFail(
            $this->documentId
        );

        $this->embed($document);
    }
}
