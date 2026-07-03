<?php

namespace App\Ai\Agents;

use App\Ai\Tools\SparqlExecutorTool;
use App\Ontology\OntologyService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;

#[MaxSteps(10)]
#[Timeout(120)]
class SparqlAssistant implements Agent, Conversational, HasStructuredOutput, HasTools
{
    use Promptable;

    public function __construct(
        protected OntologyService $ontology,
    ) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): string
    {
        return <<<PROMPT
            You generate SPARQL queries.
            IRI for Taxa always follow the scheme http://purl.obolibrary.org/obo/NCBITaxon_* .
            When given a taxon name, do not infer the NCBI Taxonomy ID, build your query around the name.
            Use the prefixes

            PREFIX gnom: <https://w3id.org/gnom/>
            PREFIX biolink: <https://w3id.org/biolink/vocab/>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

            Use the ontology below and prioritize terms from gnom.

            {$this->ontology->prompt()}


            ALWAYS use the SparqlExecutorTool to test your query.
            If an error message is returned, debug the query and test again up to 5 times.
            Return only SPARQL.
            PROMPT;
    }

    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return Message[]
     */
    public function messages(): iterable
    {
        return [];
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new SparqlExecutorTool,
        ];
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'value' => $schema->string()->required(),
        ];
    }
}
