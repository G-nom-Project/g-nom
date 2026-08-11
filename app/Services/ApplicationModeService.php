<?php

namespace App\Services;

enum PersistenceMode: string
{
    case Normal = 'normal';
    case ReadOnly = 'read_only';
}

enum BlastMode: string
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

    public function blastMode(): BlastMode
    {
        return BlastMode::from(
            config('gnom.blast', 'enabled')
        );
    }

    public function isReadOnly(): bool
    {
        return $this->persistenceMode() === PersistenceMode::ReadOnly;
    }

    public function isBlastEnabled(): bool
    {
        return $this->blastMode() === BlastMode::Enabled;
    }


}
