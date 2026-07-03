<?php

namespace App\Ontology;

class OntologySlot
{
    public function __construct(
        public string $name,
        public ?string $range = null,
        public ?string $description = null,
        public bool $required = false,
        public bool $identifier = false,
    ) {}
}
