<?php

namespace App\Services;

use AllowDynamicProperties;
use App\Models\Document;
use App\Models\DocumentElement;
use Illuminate\Support\Facades\DB;

#[AllowDynamicProperties]
class DocumentChunker
{
    public function __construct()
    {
        $this->maxTokens = config('ai.context_sizes.embeddings.max', 512);
        $this->targetTokens = config('ai.context_sizes.embeddings.target', 500);
        $this->minTokens = config('ai.context_sizes.embeddings.min', 100);
    }


    public function chunk(Document $document): void
    {
        $elements = $document->elements()
            ->orderBy('position')
            ->get();

        // Use a transaction for consistency
        DB::transaction(function () use (
            $document,
            $elements,
        ) {
            // Make re-chunking idempotent.
            $document->chunks()->delete();
            $chunkIndex = 0;
            $current = null;
            foreach ($elements as $element) {
                //A heading starts a new semantic section.
                if ($element->type === 'heading') {
                    if ($current !== null) {
                        $this->flushChunk(
                            $document,
                            $current,
                            $chunkIndex++,
                        );

                        $current = null;
                    }
                    continue;
                }

                // Ignore empty elements.
                if (trim($element->content) === '') {
                    continue;
                }

                // Try to keep figures, tables and formulas together
                if ($this->isAtomic($element)) {
                    if ($current !== null) {
                        $this->flushChunk(
                            $document,
                            $current,
                            $chunkIndex++,
                        );

                        $current = null;
                    }

                    $atomicChunk = $this->createChunk(
                        $element,
                    );

                    $this->flushChunk(
                        $document,
                        $atomicChunk,
                        $chunkIndex++,
                    );

                    continue;
                }

                $tokens = $this->estimateTokens(
                    $element->content
                );

                // Split large single paragraphs
                if ($tokens > $this->maxTokens) {
                    if ($current !== null) {
                        $this->flushChunk(
                            $document,
                            $current,
                            $chunkIndex++,
                        );

                        $current = null;
                    }

                    foreach (
                        $this->splitLargeElement($element)
                        as $piece
                    ) {
                        $this->flushChunk(
                            $document,
                            $piece,
                            $chunkIndex++,
                        );
                    }
                    continue;
                }

                // Start the first chunk
                if ($current === null) {
                    $current = $this->createChunk(
                        $element,
                    );

                    continue;
                }

                $newTokenCount =
                    $current['token_count'] +
                    $tokens;

                //Start a new chunk once the target size is reached.
                if (
                    $newTokenCount > $this->targetTokens
                    && $current['token_count'] >= $this->minTokens
                ) {
                    $this->flushChunk(
                        $document,
                        $current,
                        $chunkIndex++,
                    );

                    $current = $this->createChunk(
                        $element,
                    );
                    continue;
                }

                // Add element to current chuk
                $this->appendElement(
                    $current,
                    $element,
                );
            }


            // Flush the final chunk.
            if ($current !== null) {
                $this->flushChunk(
                    $document,
                    $current,
                    $chunkIndex++,
                );
            }
        });
    }

    /**
     * @return array{
     *     elements: array<int, DocumentElement>,
     *     content: string,
     *     token_count: int,
     *     section: ?string,
     * }
     */
    private function createChunk(
        DocumentElement $element,
    ): array {
        return [
            'elements' => [
                $element,
            ],
            'content' => $this->formatElement(
                $element,
            ),
            'token_count' => $this->estimateTokens(
                $element->content
            ),
            'section' => $element->section,

        ];
    }

    private function appendElement(
        array &$chunk,
        DocumentElement $element,
    ): void {
        $chunk['elements'][] = $element;

        $chunk['content'] .= "\n\n" .
            $this->formatElement($element);

        $chunk['token_count'] +=
            $this->estimateTokens(
                $element->content
            );
    }

    /**
     * Persist a chunk.
     */
    private function flushChunk(
        Document $document,
        array $chunk,
        int $chunkIndex,
    ): void {
        if (trim($chunk['content']) === '') {
            return;
        }

        $document->chunks()->create([
            'chunk_index' => $chunkIndex,
            'content' => $chunk['content'],
            'section' => $chunk['section'],
            'metadata' => [
                'element_ids' => collect(
                    $chunk['elements']
                )
                    ->pluck('id')
                    ->values()
                    ->all(),

                'element_types' => collect(
                    $chunk['elements']
                )
                    ->pluck('type')
                    ->values()
                    ->all(),
            ],
        ]);
    }

    /**
     * Format an element for embedding.
     */
    private function formatElement(
        DocumentElement $element,
    ): string {
        return match ($element->type) {
            'heading' =>
            "## {$element->content}",

            'figure_caption' =>
            "Figure: {$element->content}",

            'table' =>
            "Table: {$element->content}",

            'formula' =>
            "Formula: {$element->content}",

            'list_item' =>
            "- {$element->content}",

            'note' =>
            "Note: {$element->content}",

            default =>
            $element->content,
        };
    }

    private function isAtomic(
        DocumentElement $element,
    ): bool {
        return in_array(
            $element->type,
            [
                'figure_caption',
                'table',
                'formula',
            ],
            true,
        );
    }

    /**
     * Approximate token count.
     * This is only used to determine chunk boundaries, real token count depends on your tokenizer model.
     * Might be turned into a config option in the future
     */
    private function estimateTokens(
        string $text,
    ): int {
        return max(
            1,
            (int) ceil(
                mb_strlen($text) / 4
            ),
        );
    }

    /**
     * Split an oversized element into chunks without breaking sentences.
     *
     * @return array<int, array<string, mixed>>
     */
    private function splitLargeElement(
        DocumentElement $element,
    ): array {
        // Trim sentences and skip empty ones
        $sentences = preg_split(
            '/(?<=[.!?])\s+/u',
            trim($element->content),
            -1,
            PREG_SPLIT_NO_EMPTY,
        );

        if (!$sentences) {
            return [
                $this->createChunk($element),
            ];
        }

        $pieces = [];

        $current = null;

        foreach ($sentences as $sentence) {
            $tokens = $this->estimateTokens(
                $sentence
            );

            if ($current === null) {
                $current = [
                    'elements' => [$element],
                    'content' => $sentence,
                    'token_count' => $tokens,
                    'section' => $element->section,

                ];
                continue;
            }

            if (
                $current['token_count'] + $tokens
                > $this->targetTokens
            ) {
                $pieces[] = $current;

                $current = [
                    'elements' => [$element],
                    'content' => $sentence,
                    'token_count' => $tokens,
                    'section' => $element->section,
                ];
                continue;
            }

            $current['content'] .=
                ' ' . $sentence;

            $current['token_count'] +=
                $tokens;
        }

        if ($current !== null) {
            $pieces[] = $current;
        }
        return $pieces;
    }
}
