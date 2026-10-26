<?php

namespace App\Mcp\Tools;

use App\Services\ApplicationModeService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\Http;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('A description of what this tool does.')]
class ExecuteSparqlQuery extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): ResponseFactory
    {
        //
        if (! app(ApplicationModeService::class)->isSparqlConsoleEnabled()) {
            Response::text('SPARQL tools are disabled on this instance.');
        }
        $response = Http::timeout(120)
            ->get(config('gnom.qlever_host'), [
                'query' => $request->get('query'),
            ]);

        return Response::structured(['result' => $response->json(), 'status' => $response->status()]);
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            //
            'query' => $schema->string()
                ->description('The SPARQL query.')
                ->required(),
        ];
    }
}
