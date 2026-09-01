<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;
use App\Services\ApplicationModeService;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Log;

class DocumentPolicy
{
    use HandlesTokenAbilities;

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
    public function view(User $user, Document $document): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($this->tokenAllows($user, 'write:document')) {
            return $user->is_admin || $user->is_contributor;
        }
        Log::info($user);
        return $user->is_admin || $user->is_contributor;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Document $document): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Document $document): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Document $document): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Document $document): bool
    {
        return false;
    }
}
