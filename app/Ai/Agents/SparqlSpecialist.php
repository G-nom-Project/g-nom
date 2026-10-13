<?php

namespace App\Ai\Agents;

use App\Ai\Tools\ExecuteSparqlTool;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\CanActAsTool;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

#[MaxSteps(20)]
class SparqlSpecialist implements Agent, CanActAsTool, HasTools
{
    use Promptable;

    public function name(): string
    {
        return 'SparqlSpecialist';
    }

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return 'You are a specialist in designing SPARQL queries in the G-nom Ontology.
        Your default headers are:

        PREFIX gnom: <https://w3id.org/gnom/>
        PREFIX biolink: <https://w3id.org/biolink/vocab/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        Relevant special subjects: gnom:Assembly, biolink:OrganismTaxon,
        Relevant special predicates: gnom:in_taxon, gnom:parent_taxon, rdfs:label

        Return only the SPARQL query!
        Explicitly enforce correct subjects like
            ?x a gnom:Assembly
        in your queries!
        ';
    }

    public function description(): string
    {
        return 'Form and validate SPARQL queries against G-nom Ontology and database. Returns a SPARQL query. The query can be executed using the ExecuteSparqlTool';
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
        return [ExecuteSparqlTool::class];
    }
}
