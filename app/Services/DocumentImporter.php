<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentImporter
{
    public function __construct(
        private readonly GrobidTeiParser $parser,
    ) {
    }

    public function import(
        string $teiXml,
        ?string $filePath = null,
    ): Document {
        $parsed = $this->parser->parse($teiXml);

        $vault = Storage::disk('vault');
        $local = Storage::disk('local');

        return DB::transaction(function () use (
            $local,
            $parsed,
            $filePath,
            $vault,
        ) {
            $document = Document::create([
                'title' => $parsed['title'],
                'abstract' => $parsed['abstract'],
                'doi' => $parsed['doi'],
                'authors' => $parsed['authors'],
                'file_path' => $filePath,
                'file_hash' => md5_file($local->path($filePath)),
            ]);

            $this->storeElements(
                $document,
                $parsed['elements'],
            );

            $this->storeReferences(
                $document,
                $parsed['references'],
            );

            $vault->put("/documents/{$document->id}", $local->get($filePath));

            return $document->fresh([
                'elements',
            ]);
        });
    }

    /**
     * @param array<int, array<string, mixed>> $elements
     */
    private function storeElements(
        Document $document,
        array $elements,
    ): void {
        foreach ($elements as $element) {
            $metadata = $element['metadata'] ?? [];

            $document->elements()->create([
                'position' => $element['position'],
                'type' => $element['type'],
                'section' => $element['section'],
                'content' => $element['content'],
                'label' => $element['label'] ?? null,
                'metadata' => $metadata,
            ]);
        }
    }

    /**
     * @param array<int, array<string, mixed>> $references
     */
    private function storeReferences(
        Document $document,
        array $references,
    ): void {
        foreach ($references as $reference) {
            $document->references()->create([
                'reference_id' => $reference['id'] ?? null,
                'type' => $reference['type'],
                'content' => $reference['content'],
                'metadata' => $reference['metadata'] ?? [],
            ]);
        }
    }
}
