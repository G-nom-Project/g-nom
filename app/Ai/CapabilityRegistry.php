<?php

namespace App\Ai;

use App\Ai\Agents\SparqlSpecialist;
use App\Ai\Tools\AssemblySearchTool;
use App\Ai\Tools\BookmarkTool;
use App\Ai\Tools\ExecuteSparqlTool;
use App\Ai\Tools\LiteratureResearchTool;
use App\Ai\Tools\RetrieveBuscoTool;
use App\Ai\Tools\RetrieveFcatTool;
use App\Ai\Tools\RetrieveRepeatmaskerTool;
use App\Ai\Tools\TaxonSearchTool;
use App\Models\User;
use App\Services\ApplicationModeService;

class CapabilityRegistry
{
    public static function tools(): array
    {
        return [
            AssistantCapability::Assembly->value => [
                AssemblySearchTool::class,
                RetrieveBuscoTool::class,
                RetrieveRepeatmaskerTool::class,
                RetrieveFcatTool::class,
            ],

            AssistantCapability::Analysis->value => [
                // Later
            ],

            AssistantCapability::Literature->value => [
                LiteratureResearchTool::class,
            ],

            AssistantCapability::Taxonomy->value => [
                // Taxonomy tools
                TaxonSearchTool::class,
            ],

            AssistantCapability::User->value => [
                BookmarkTool::class,
            ],

            AssistantCapability::Sparql->value => [
                ExecuteSparqlTool::class,
                SparqlSpecialist::class,
            ]
        ];
    }

    /**
     * @param  array<string>  $capabilities
     * @return array<object>
     */
    public static function resolve(
        array $capabilities,
        User $user,
    ): array {
        // Enforce SPARQL config for agents as well
        if (! app(ApplicationModeService::class)->isSparqlConsoleEnabled()) {
            $capabilities = array_diff($capabilities, ['sparql']);
        }

        return collect(self::tools())
            ->only($capabilities)
            ->flatten()
            ->unique()
            ->map(fn (string $class) => app()->makeWith($class, [
                'user' => $user,
            ]))
            ->values()
            ->all();
    }
}
