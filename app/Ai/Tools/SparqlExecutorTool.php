<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SparqlExecutorTool implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'This tool executes a given SPARQL query. The result from the server is returned as JSON and status code. If the query is malformed, an expressive error is returned which may be used to debug the query.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        //
        $response = Http::timeout(120)
            ->get(config('gnom.qlever_host'), [
                'query' => $request['value'],
            ]);

        return json_encode([
            'response' => $response->json(),
            'status' => $response->status(),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'value' => $schema->string()->required(),
        ];
    }
}
