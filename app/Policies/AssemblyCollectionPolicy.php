<?php

namespace App\Policies;

use App\Models\AssemblyCollection;
use App\Models\User;

class AssemblyCollectionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AssemblyCollection $assemblyCollection): bool
    {
        return $assemblyCollection->is_public
            || $user->is_admin
            || $assemblyCollection->users()
                ->where('users.id', $user->id)
                ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->is_admin;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, AssemblyCollection $assemblyCollection): bool
    {
        $currentUser = $assemblyCollection->users->firstWhere('id', $user->id);
        $role = $currentUser?->pivot->role;

        return $user->id === $assemblyCollection->user_id || $user->is_admin || $role === 'editor';
    }

    /**
     * Determine whether the user can update the model with advanced permissions.
     */
    public function admin(User $user, AssemblyCollection $assemblyCollection): bool
    {
        return $user->id === $assemblyCollection->user_id || $user->is_admin;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AssemblyCollection $assemblyCollection): bool
    {
        return $user->id === $assemblyCollection->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, AssemblyCollection $assemblyCollection): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, AssemblyCollection $assemblyCollection): bool
    {
        return false;
    }
}
