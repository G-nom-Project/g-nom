<?php

namespace App\Ontology;

class OntologyClass
{
    public string $name;

    public ?string $description = null;

    public ?string $parent = null;

    /** @var OntologySlot[] */
    public array $slots = [];
}
