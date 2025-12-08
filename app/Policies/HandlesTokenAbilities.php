<?php


namespace App\Policies;

trait HandlesTokenAbilities
{
    /**
     * Check if the user can perform a given ability via token.
     */
    protected function tokenAllows($user, string $ability): bool
    {
        return $user->hasAbility($ability);
    }
}
