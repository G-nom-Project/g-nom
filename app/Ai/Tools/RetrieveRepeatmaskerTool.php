<?php

namespace App\Ai\Tools;

use App\Models\Assembly;
use App\Models\RepeatmaskerAnalysis;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class RetrieveRepeatmaskerTool implements Tool
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
        Given a numeric assembly ID, retrieve all Repeatmasker analyses associated with the assembly. The results are
        a list in JSON format, with the following structure:
        {
            sines: Number of Short Interspersed Nuclear Elements (SINEs)
            sines_length: Total length of Short Interspersed Nuclear Elements (SINEs)
            lines: Number of Long interspersed nuclear elements
            lines_length: Total length of Long interspersed nuclear elements
            ltr_elements: Number of Long terminal repeat elements
            ltr_elements_length: Total length of Long terminal repeat elements
            dna_elements: Number of DNA repeat elements
            dna_elements_length: Total length of DNA repeat elements
            unclassified: Number of unclassified elements
            unclassified_length: Total length of unclassified elements
            rolling_circles: Number of Rolling Circles
            rolling_circles_length: Total length of Rolling Circles
            small_rna: Number of small RNA elements
            small_rna_length: Total length of small RNA elements
            satellites: Number of satellite elements
            satellites_length: Total length of satellite elements
            simple_repeats: Number of simple repeat elements
            simple_repeats_length: Total length of simple repeat elements
            low_complexity: Number of low complexity elements
            low_complexity_length: Total length of low complexity elements
            total_non_repetitive_length_percent: % of the genome which is not repetitive
            total_non_repetitive_length: Total bp of the genome which are not repetitive
            total_repetitive_length_percent: % of the genome which are repetitive
            total_repetitive_length: Total bp of the genome which are repetitive
            numberN: Number bases which are masked as "N"
            percentN: Percent bases which are masked as "N"
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
        $assembly = Assembly::where('id', (int)$request['value'])->first();
        if(!$assembly){
            return "This assembly ID does not exist.";
        }

        if ($this->user->cannot('view', $assembly)) {
            return "The requested assembly is not available to this user. NOTIFY THE USER!";
        }

        return RepeatmaskerAnalysis::where('assembly_id', (int)$request['value'])->get();

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
