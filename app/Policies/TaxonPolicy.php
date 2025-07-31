<?php

namespace App\Policies;

use App\Models\Taxon;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaxonPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Taxa are visible to all.
     */
    public function view(User $user, Taxon $taxon): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model. This includes headlines, info texts, GEO-JSON and images.
     */
    public function update(User $user, Taxon $taxon): bool
    {
        return $user->role === "admin" || $user->role === "editor";
    }

    /**
     * Individual taxa should never be deleted, this will corrupt the copy of the NCBI Taxonomy DB.
     */
    public function delete(User $user, Taxon $taxon): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Taxon $taxon): bool
    {
        return false;
    }

    /**
     * Individual taxa should never be deleted, this will corrupt the copy of the NCBI Taxonomy DB.
     */
    public function forceDelete(User $user, Taxon $taxon): bool
    {
        return false;
    }
}
