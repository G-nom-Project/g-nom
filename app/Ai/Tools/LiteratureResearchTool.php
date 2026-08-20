<?php

namespace App\Ai\Tools;

use App\Models\DocumentChunk;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Laravel\Ai\Tools\SimilaritySearch;
use Stringable;

class LiteratureResearchTool implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Search the G-nom paper collection (corpus) to answer scientific questions exceeding the information
        available using only the AssemblySearchTool, RetrieveBuscoTool or RetrieveRepeatmaskerTool. Results consist of
        chunks of scientific papers in a JSON schema. Each chunk has a document_id. Mark sentences based of a certain
        chunk by appending document_id to ¶, resulting in ¶document_id. Do not confuse document_id with chunk_id or
        chunk_index. Never produce ¶chunk_id or ¶chunk_index. Do not make up document_ids.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        //

        return SimilaritySearch::usingModel(DocumentChunk::class, 'embedding')->handle($request);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema
                ->string()
                ->description('The search query.')
                ->required(),
        ];
    }
}
