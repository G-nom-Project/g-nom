<?php

namespace App\Ai\Tools;

use App\Models\Assembly;
use App\Models\FcatAnalysis;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class RetrieveFcatTool implements Tool
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

        Given a numeric assembly ID, retrieve all fCat analyses associated with the assembly. fCat analyses can be used
        to assess the completeness of a genome assembly.

        fCAT is a feature-aware Completeness Assessment Tool for gene sets. fCAT checks for the presence of conserved
        genes (the core genes) of a specific taxonomy clade using feature-aware directed ortholog search fDOG.
        In addition to the length criteria for classifying the found orthologs (as same as BUSCO), fCAT utilizes the
        domain architecture similarity FAS scores to further validate the orthologs.

        The results are a list in JSON format, with the following structure:
        {
            id: numeric ID of fCat analysis.
            assembly_id: ID of the assembly.
            genomeID: Internal ID of the genome used by fCat.
        }

        Additionally, for each of 4 modes of operation, the tools provides counts for
        - similar
        - dissimilar
        - duplicated
        - missing
        - ignored
        including percentages.

        The 4 modes differ by cutoff and the value used for comparing genes:
        M1 / Strict mode / Mean of FAS scores between all core orthologs / Mean of FAS scores between query ortholog and all core proteins
        M2 / Reference mode	Mean of FAS scores between refspec and all other core orthologs	Mean of FAS scores between query ortholog and refspec protein
        M3 / Relaxed mode / The lower bound of the confidence interval calculated by the distribution of all-vs-all FAS score in a core group / Mean of FAS scores between query ortholog and all core proteins
        M4 / Length mode / Mean and standard deviation of all core protein lengths / Length of query ortholog

        There is no dedicated resource URL you can return for fCat results. Instead, provide a human-readable output of
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

        $analysis = FcatAnalysis::where('assembly_id', (int) $request['value'])->get();
        $analysis->makeHidden(['created_at', 'updated_at']);

        return $analysis;

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
