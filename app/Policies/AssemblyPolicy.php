<?php

namespace App\Policies;

use App\Models\Assembly;
use App\Models\User;

class AssemblyPolicy
{
    use HandlesTokenAbilities;

    public function viewAny(User $user): bool
    {
      return false;
    }

    public function view(User $user, Assembly $assembly): bool
    {
        if ($this->tokenAllows($user, 'read:assemblies')) {
            return $assembly->public || $user->id === $assembly->owner || $user->is_admin;
        }

        return $assembly->public || $user->id === $assembly->owner || $user->is_admin;
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
            return $user->id === $assembly->owner || $user->is_admin;
        }

        return $user->id === $assembly->owner || $user->is_admin;
    }

    public function delete(User $user, Assembly $assembly): bool
    {
        if ($this->tokenAllows($user, 'delete:assemblies')) {
            return $user->id === $assembly->owner || $user->is_admin;
        }

        return $user->id === $assembly->owner || $user->is_admin;
    }
}
