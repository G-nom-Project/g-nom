<?php

namespace App\Services;

/**
 * Reusable base class for querying SPARQL endpoints.
 */
class RdfService
{
    /**
     * Number of retry attempts for transient endpoint failures.
     */
    protected int $retries;

    public string $rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

    public string $rdfs = 'http://www.w3.org/2000/01/rdf-schema#';

    public string $xsd = 'http://www.w3.org/2001/XMLSchema#';

    public string $gnom = 'https://w3id.org/gnom/';

    public string $biolink = 'https://w3id.org/biolink/vocab/';

    public function __construct() {}

    public function taxonUri(int|string $id): string
    {
        return "{$this->gnom}taxon/{$id}";
    }

    public function assemblyUri(int|string $id): string
    {
        return config('app.url')."/assemblies/{$id}";
    }

    public function taxaminerUri(int|string $id): string
    {
        return "{$this->gnom}TaxaminerAnalysis/{$id}";
    }

    public function assignmentUri(int|string $id): string
    {
        return "{$this->gnom}GeneTaxonomicAssignment/{$id}";
    }

    public function escapeLiteral(string $value): string
    {
        return addslashes($value);
    }

    public function tripleUri(
        string $subject,
        string $predicate,
        string $object
    ): string {
        return "<{$subject}> <{$predicate}> <{$object}> .";
    }

    public function tripleLiteral(
        string $subject,
        string $predicate,
        string|int $literal,
        ?string $datatype = null
    ): string {

        $line = "<{$subject}> <{$predicate}> ";
        $line .= "\"{$literal}\"";

        if ($datatype !== null) {
            $line .= "^^<{$datatype}>";
        }

        $line .= ' .';

        return $line;
    }
}
