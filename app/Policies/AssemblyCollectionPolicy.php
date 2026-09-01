<?php

namespace App\Policies;

use App\Models\AssemblyCollection;
use App\Models\User;
use App\Services\ApplicationModeService;

class AssemblyCollectionPolicy
{
    /**
     * Enforces read-only config flag
     */
    public function before(User $user, string $ability): ?bool
    {
        if (
            app(ApplicationModeService::class)->isReadOnly()
            && in_array($ability, ['create', 'update', 'delete', 'restore', 'forceDelete'])
        ) {
            return false;
        }

        return null;
    }

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
    public function view(User | null $user, AssemblyCollection $assemblyCollection): bool
    {
        // If the user is unset, we are dealing with a public G-nom Instance
        if (!$user) {
            if (config('gnom.public', false)) {
                return $assemblyCollection->is_public;
            } else {
                return false;
            }
        }

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
