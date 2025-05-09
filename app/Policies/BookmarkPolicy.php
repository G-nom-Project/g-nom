<?php

namespace App\Policies;

use App\Models\Bookmark;
use App\Models\User;

class BookmarkPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Bookmark $bookmark): bool
    {
        return $user->id === $bookmark->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Bookmark $bookmark): bool
    {
        return $user->id === $bookmark->user_id;
    }

    public function delete(User $user, Bookmark $bookmark): bool
    {
        return $user->id === $bookmark->user_id;
    }

    public function restore(User $user, Bookmark $bookmark): bool
    {
        return $user->id === $bookmark->user_id;
    }

    public function forceDelete(User $user, Bookmark $bookmark): bool
    {
        return $user->id === $bookmark->user_id;
    }
}
