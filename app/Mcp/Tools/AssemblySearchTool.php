<?php

namespace App\Mcp\Tools;

use App\Models\Assembly;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Facades\Auth;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('This tool is full-text search across all available genomic assemblies in this G-nom instance. Search queries may include assembly name, taxon name or NCBI TaxonID.')]
class AssemblySearchTool extends Tool
{
    /**
     * Handle the tool request.
     */
    public function handle(Request $request): ResponseFactory
    {
        //

        $search = $request->get('query');
        $assemblies = Assembly::query()
            ->visibleTo(Auth::user())
            ->where(function ($query) use ($search) {
                $query->where('name', 'LIKE', "%{$search}%")
                    ->orWhereHas('taxon', function ($query) use ($search) {
                        $query->where(function ($query) use ($search) {
                            $query->where('commonName', 'LIKE', "%{$search}%")
                                ->orWhere('scientificName', 'LIKE', "%{$search}%");
                        });
                    });
            })
            ->withCount([
                'mappings',
                'genomicAnnotations',
                'buscoAnalyses',
                'repeatmaskerAnalyses',
                'taxaminerAnalyses',
                'fcatAnalyses',
            ])
            ->with('taxon.infos')
            ->get();

        // Omit some fields to save tokens
        $assemblies->makeHidden([
            'shard_id',
            'taxon_ncbiTaxonID',
            'public',
            'lengthDistributionString',
        ]);

        return Response::structured(['assemblies' => $assemblies]);
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
                ->description('The stringable search query.')
                ->required(),
        ];
    }
}
