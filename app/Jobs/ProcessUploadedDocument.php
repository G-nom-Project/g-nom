<?php

namespace App\Jobs;

use App\Jobs\Base\TrackableJob;
use App\Models\Document;
use App\Models\UserJob;
use App\Services\DocumentChunker;
use App\Services\DocumentImporter;
use App\Services\GrobidClient;
use App\Services\GrobidTeiParser;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Embeddings;

class ProcessUploadedDocument extends TrackableJob
{
    use Queueable;

    protected string $filepath;
    protected int $userID;
    private $batchSize = 32;

    /**
     * Create a new job instance.
     */

    public function __construct(int $userJobId, string $filepath)
    {
        parent::__construct($userJobId);
        $this->filepath = $filepath;
        $me = UserJob::where('id', $userJobId)->firstOrFail();
        $this->userID = $me->user_id;
    }

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
            ->dimensions(config('ai.context_sizes.embeddings.result', 1024))
            ->timeout(900)
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

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->markRunning();
        // Parse document into XML
        try {
            $xml = app(GrobidClient::class)->processFulltext($this->filepath);
        } catch (\Exception $e) {
            $this->markFailed($e->getMessage());
            $this->fail($e);
        }
        $this->setProgress(25);
        // Import document
        $document = (new DocumentImporter(app(GrobidTeiParser::class), $this->userID))->import($xml, $this->filepath);
        $this->setProgress(50);
        // Chunk document
        (new DocumentChunker)->chunk($document);
        $this->setProgress(75);
        // Embed document
        $this->embed($document);
        $this->markCompleted();
    }
}
