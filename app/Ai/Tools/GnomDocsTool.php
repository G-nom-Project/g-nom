<?php

namespace App\Ai\Tools;

use App\Models\GnomKnowledgeBaseEntry;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Laravel\Ai\Tools\SimilaritySearch;
use Stringable;

class GnomDocsTool implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Search the G-nom knowledge base for information about G-nom functionality.Use this tool when users ask
        questions about G-nom. Contents returned by this tool may contain AsciiDoc syntax.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        //

        return SimilaritySearch::usingModel(GnomKnowledgeBaseEntry::class, 'embedding')->handle($request);
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
