<?php

namespace App\Ontology;

class OntologyService
{
    public function __construct(
        protected LinkMLOntology $ontology
    ) {}

    public function prompt(): string
    {
        $lines = [];

        $lines[] = 'Ontology';
        $lines[] = '';

        foreach ($this->ontology->classes() as $class) {

            $lines[] = $class->name;

            if ($class->description) {
                $lines[] = "Description: {$class->description}";
            }

            if ($class->parent) {
                $lines[] = "Subclass of {$class->parent}";
            }

            foreach ($class->slots as $slot) {

                $line = "- {$slot->name}";

                if ($slot->range) {
                    $line .= " -> {$slot->range}";
                }

                if ($slot->identifier) {
                    $line .= ' (identifier)';
                }

                if ($slot->required) {
                    $line .= ' (required)';
                }

                $lines[] = $line;
            }

            $lines[] = '';
        }

        return implode("\n", $lines);
    }
}
