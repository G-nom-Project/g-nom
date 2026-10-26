<?php

namespace App\Mcp\Tools;

use App\Models\Assembly;
use App\Models\BuscoAnalysis;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Given a numeric assembly ID, retrieve all BUSCO analyses associated with the assembly.')]
class RetrieveBuscoTool extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): ResponseFactory
    {
        //
        $assembly = Assembly::where('id', (int) $request->get('assembly_id'))->first();
        if (! $assembly) {
            return Response::structured(['message' => 'This assembly does not exist.']);
        }

        if (Auth::user()->cannot('view', $assembly)) {
            return Response::structured(['message' => 'The current user is not authorized to view this assembly ID.']);
        }

        $analysis = BuscoAnalysis::where('assembly_id', (int) $request->get('assembly_id'))->get();

        // $analysis->makeHidden(['targetFile', 'created_at', 'updated_at']);
        return Response::structured(['analyses' => $analysis]);
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, Type>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'assembly_id' => $schema->string()
                ->description('The internal, G-nom specific assembly ID the BUSCO analyses belong to.')
                ->required(),
        ];
    }
}
