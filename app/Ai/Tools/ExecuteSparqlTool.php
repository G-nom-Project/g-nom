<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ExecuteSparqlTool implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'This tool allows you to execute arbitrary read-only SPARQL commands against G-nom triple store.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        // Execute response
        $response = Http::timeout(120)
            ->get(config('gnom.qlever_host'), [
                'query' => $request['query'],
            ]);

        // We need a way to handle extremely large results, either by returning a corresponding answer or requiring user approval

        return $response->body();
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()->required(),
        ];
    }
}
