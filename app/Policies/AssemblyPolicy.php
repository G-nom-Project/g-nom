<?php

namespace App\Policies;

use App\Models\Assembly;
use App\Models\User;
use App\Services\ApplicationModeService;

class AssemblyPolicy
{
    use HandlesTokenAbilities;

    /**
     * Enforces read-only config flag
     */
    public function before(User $user, string $ability): ?bool
    {
        if (
            app(ApplicationModeService::class)->isReadOnly()
            && in_array($ability, ['create', 'update', 'delete'])
        ) {
            return false;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, Assembly $assembly): bool
    {
        if ($this->tokenAllows($user, 'read:assemblies')) {
            return $this->canViewAssembly($user, $assembly);
        }

        return $this->canViewAssembly($user, $assembly);
    }

    protected function canViewAssembly(User $user, Assembly $assembly): bool
    {
        return $assembly->public
            || $assembly->user_id === $user->id
            || $user->is_admin
            || $assembly->collections()
                ->whereHas('users', function ($query) use ($user) {
                    $query->where('users.id', $user->id);
                })
                ->exists();
    }

    public function create(User $user): bool
    {
        if ($this->tokenAllows($user, 'write:assemblies')) {
            return $user->is_admin || $user->is_contributor;
        }

        return $user->is_admin || $user->is_contributor;
    }

    public function update(User $user, Assembly $assembly): bool
    {
        if ($this->tokenAllows($user, 'write:assemblies')) {
            return $user->id === $assembly->user_id || $user->is_admin;
        }

        return $user->id === $assembly->user_id || $user->is_admin;
    }

    public function delete(User $user, Assembly $assembly): bool
    {
        if ($this->tokenAllows($user, 'delete:assemblies')) {
            return $user->id === $assembly->user_id || $user->is_admin;
        }

        return $user->id === $assembly->user_id || $user->is_admin;
    }
}
