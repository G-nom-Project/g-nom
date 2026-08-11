<?php

namespace App\Services;

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
}
