<?php

namespace App\Ai;

use App\Ai\Tools\AssemblySearchTool;
use App\Ai\Tools\BookmarkTool;
use App\Ai\Tools\LiteratureResearchTool;
use App\Ai\Tools\RetrieveBuscoTool;
use App\Ai\Tools\RetrieveFcatTool;
use App\Ai\Tools\RetrieveRepeatmaskerTool;
use App\Ai\Tools\TaxonSearchTool;
use App\Models\User;

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
