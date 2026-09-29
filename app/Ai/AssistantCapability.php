<?php

namespace App\Ai;

/**
 * Sorts Tools into related categories referred to as capabilities. All tools should be listed in at least one category.
 * Tools not listed here will be unavailable on instances with Tool Routing enabled
 */
enum AssistantCapability: string
{
    case Assembly = 'assembly';
    case Analysis = 'analysis';
    case Literature = 'literature';
    case Taxonomy = 'taxonomy';
    case User = 'user';

    public function description(): string
    {
        return match ($this) {
            self::Assembly => 'Search and inspect genomic assemblies and assembly metadata. Includes BUSCO and Repeatmasker.',

            self::Analysis => 'Retrieve and interpret genomic analysis results and metrics.',

            self::Literature => 'Search scientific literature and retrieve relevant publications.',

            self::Taxonomy => 'Retrieve taxonomy and organism information.',

            self::User => 'User personalization features on behalf of the users: Bookmarks',
        };
    }
}
