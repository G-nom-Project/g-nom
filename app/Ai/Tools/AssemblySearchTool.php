<?php

namespace App\Ai\Tools;

use App\Models\Assembly;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class AssemblySearchTool implements Tool
{
    public function __construct(
        protected User $user,
    ) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'This tool is full-text search across all available genomic assemblies in this G-nom instance. Search
        queries may include assembly name, taxon name or NCBI TaxonID.
        When assemblies from the results are mentioned, link them using '.config('app.url').'/assemblies/ followed
        by the assembly ID. Results are JSON formatted with the following format:
        {
            id: the numeric G-nom assembly ID. You can use this ID to retrieve advanced information using other tools
            shard_id: Shard ID in the internal BLAST DB
            name: Human-readable name
            infoText: A human-readable info text
            taxon_ncbiTaxonID: Numeric NCBI TaxonID
            public: Visibility
            numberOfSequences: Number of sequences
            cumulativeSequenceLength: Total basepairs
            n50: N50 value
            n90: N90 value
            gcPercent: GC content of the genome
            coverage: Availability of read coverage information
            mappings_count: Number of genomic mappings available
            genomic_annotations_count: Number of genomic annotations available
            busco_analyses_count: Number of busco analyses available
            repeatmasker_analyses_count: Number of repeatmasker analyses available
            taxaminer_analyses_count: Number of taxaminer analyses available
            # Taxon assembly belongs to:
            taxon:
                {
                    ncbiTaxonID: Numeric NCBI TaxonID
                    parentNcbiTaxonID: Parent NCBI TaxonID
                    scientificName: A human-readable name of the Taxon
                    taxonRank: Rank in the taxonomy scheme
                    commonName: Common name of the Taxon
                    infos: Text bits about the taxon.
                }
        }
        IMPORTANT: When the user asks for information that requires another
        assembly-specific tool, use the returned `id` as the `value`
        argument to that tool.

        For example:
        AssemblySearchTool → result.id → RetrieveBuscoTool.value
        ';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): string|Stringable
    {
        //
        $search = $request['value'];
        $assemblies = Assembly::query()
            ->visibleTo($this->user)
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

        return $assemblies;
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
