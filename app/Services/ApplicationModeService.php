<?php

namespace App\Services;

use phpDocumentor\Reflection\Types\Boolean;

enum PersistenceMode: string
{
    case Normal = 'normal';
    case ReadOnly = 'read_only';
}

enum BasicFlag: string
{
    case Enabled = 'enabled';
    case Disabled = 'disabled';
}


enum AiFlag: string
{
    case Internal = 'internal';
    case BYOM = 'byom';
    case BYOM_and_Internal = 'byom+internal';
    case Disabled = 'disabled';
}

class ApplicationModeService
{
    public function persistenceMode(): PersistenceMode
    {
        return PersistenceMode::from(
            config('gnom.is_readonly', 'normal')
        );
    }

    public function blastMode(): BasicFlag
    {
        return BasicFlag::from(
            config('gnom.blast', 'enabled')
        );
    }

    public function sparqlConsoleMode(): BasicFlag
    {
        return BasicFlag::from(
            config('gnom.sparql_console', 'enabled')
        );
    }

    public function wikidataMode(): BasicFlag
    {
        return BasicFlag::from(
            config('gnom.wikidata', 'enabled')
        );
    }

    public function AiMode(): AiFlag
    {
        return AiFlag::from(
            config('gnom.agents', 'enabled')
        );
    }

    public function isReadOnly(): bool
    {
        return $this->persistenceMode() === PersistenceMode::ReadOnly;
    }

    public function isBlastEnabled(): bool
    {
        return $this->blastMode() === BasicFlag::Enabled;
    }

    public function isSparqlConsoleEnabled(): bool
    {
        return $this->sparqlConsoleMode() === BasicFlag::Enabled;
    }

    public function isWikidataEnabled(): bool
    {
        return $this->wikidataMode() === BasicFlag::Enabled;
    }

    public function isAiEnabled(): bool
    {
        return config('gnom.agents_enabled', false);
    }

    public function isInternalAiEnabled(): bool
    {
        return $this->aiMode() === AiFlag::Internal || $this->aiMode() === AiFlag::BYOM_and_Internal;
    }

    public function isBYOMEnabled(): bool
    {
        return $this->aiMode() === AiFlag::BYOM || $this->aiMode() === AiFlag::BYOM_and_Internal;
    }

    public function isPublic() : bool {
        return config('gnom.public', false);
    }
}
