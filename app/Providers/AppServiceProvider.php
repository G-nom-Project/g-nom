<?php

namespace App\Providers;

use App\Models\Bookmark;
use App\Models\User;
use App\Policies\BookmarkPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Gate::policy(Bookmark::class, BookmarkPolicy::class);

        Gate::define('viewPulse', function (User $user) {
            return $user->role === 'admin';
        });
    }
}
