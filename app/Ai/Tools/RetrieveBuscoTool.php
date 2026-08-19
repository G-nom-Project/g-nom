<?php

namespace App\Ai\Tools;

use App\Models\Assembly;
use App\Models\BuscoAnalysis;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class RetrieveBuscoTool implements Tool
{
    public function __construct(
        protected User $user,
    ) {}

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return '
        Input:
        - value: The numeric G-nom assembly ID returned by AssemblySearchTool.

        Do not invent assembly IDs. Only call this tool with an assembly ID
        obtained from the conversation, user input, or another G-nom tool.
        Given a numeric assembly ID, retrieve all BUSCO analyses associated with the assembly. The results are
        a list in JSON format, with the following structure:
        {
            id: numeric ID of BUSCO analysis.
            assembly_id: ID of the assembly.
            name: Human-readable name of the BUSCO analysis.
            completeSingle: Number of complete, single copy marker genes.
            completeDuplicate: Number of complete, duplicate copy marker genes.
            fragmented: Number of fragmented marker genes.
            missing: Number of missing marker genes.
            total: Number of total copy marker genes.
            completeSinglePercent: % of complete, single copy marker genes.
            completeDuplicatedPercent: % of complete, duplicate copy marker genes.
            fragmentedPercent: % of fragmented marker genes.
            missingPercent: % of missing marker genes.
            dataset: Name of the BUSCO lineage datasets used to obtain marker genes.
            buscoMode: Mode BUSCO was run in.
        }

        There is no dedicated resource URL you can return for BUSCO results. Instead, provide a human-readable output of
        the above results.
        ';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        //
        $assembly = Assembly::where('id', (int) $request['value'])->first();
        if (! $assembly) {
            return 'This assembly ID does not exist.';
        }

        if ($this->user->cannot('view', $assembly)) {
            return 'The requested assembly is not available to this user. NOTIFY THE USER!';
        }

        return BuscoAnalysis::where('assembly_id', (int) $request['value'])->get();

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
