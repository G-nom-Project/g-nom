<?php

namespace App\Ai\Tools;

use App\Models\Taxon;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class TaxonSearchTool implements Tool
{
    public function __construct(
        protected User $user,
    ) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'This tool is full-text search across all available taxa in this G-nom instance. Possible queries:
        taxon name and NCBI taxonomy ID.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): string|Stringable
    {
        //
        $search = $request['value'];
        if (is_numeric($search)) {
            return Taxon::where('ncbiTaxonID', (int) $search);
        }

        $taxa = Taxon::where('commonName', 'LIKE', "%{$search}%")
            ->orWhere('scientificName', 'LIKE', "%{$search}%")
            ->with('assemblies')
            ->get();

        return $taxa;
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
