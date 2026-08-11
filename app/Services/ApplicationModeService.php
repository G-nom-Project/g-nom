<?php

namespace App\Services;

enum PersistenceMode: string
{
    case Normal = 'normal';
    case ReadOnly = 'read_only';
}

class ApplicationModeService
{
    public function persistenceMode(): PersistenceMode
    {
        return PersistenceMode::from(
            config('gnom.is_readonly', 'normal')
        );
    }

    public function isReadOnly(): bool
    {
        return $this->persistenceMode() === PersistenceMode::ReadOnly;
    }
}
