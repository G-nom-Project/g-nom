<?php

namespace App\Ontology;

use Symfony\Component\Yaml\Yaml;

class LinkMLOntology
{
    /** @var array<string, OntologyClass> */
    protected array $classes = [];

    protected array $globalSlots = [];

    public function __construct(string $schemaFile)
    {
        $schema = Yaml::parseFile($schemaFile);

        $this->globalSlots = $schema['slots'] ?? [];

        foreach ($schema['classes'] ?? [] as $className => $definition) {

            $class = new OntologyClass;

            $class->name = $className;
            $class->description = $definition['description'] ?? null;
            $class->parent = $definition['is_a'] ?? null;

            foreach ($definition['attributes'] ?? [] as $slotName => $slotDefinition) {

                $slot = $this->buildSlot($slotName, $slotDefinition);

                $class->slots[] = $slot;
            }

            foreach ($definition['slots'] ?? [] as $slotName) {

                $slot = $this->buildSlot($slotName, []);

                $class->slots[] = $slot;
            }

            $this->classes[$className] = $class;
        }
    }

    protected function buildSlot(string $name, array $local): OntologySlot
    {
        $global = $this->globalSlots[$name] ?? [];

        return new OntologySlot(
            name: $name,
            range: $local['range']
            ?? $global['range']
            ?? null,

            description: $local['description']
            ?? $global['description']
            ?? null,

            required: $local['required']
            ?? false,

            identifier: $local['identifier']
            ?? false,
        );
    }

    /**
     * @return OntologyClass[]
     */
    public function classes(): array
    {
        return $this->classes;
    }

    public function class(string $name): ?OntologyClass
    {
        return $this->classes[$name] ?? null;
    }
}
