<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserJob;

class UserJobPolicy
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
    public function view(User $user, UserJob $userJob): bool
    {
        return $user == $userJob->user;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, UserJob $job): bool
    {
        if ($job->job_type == 'SingleBlastQuery') {
            return true;
        }

        if ($user->role == 'admin') {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, UserJob $userJob): bool
    {
        return $user == $userJob->user || $user->role == 'admin';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, UserJob $userJob): bool
    {
        return $user == $userJob->user || $user->role == 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, UserJob $userJob): bool
    {
        return $user == $userJob->user || $user->role == 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, UserJob $userJob): bool
    {
        return $user == $userJob->user || $user->role == 'admin';
    }
}
