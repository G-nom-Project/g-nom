<?php

namespace App\Providers;

use App\Models\Bookmark;
use App\Models\User;
use App\Policies\BookmarkPolicy;
use App\Services\GrobidClient;
use App\Services\GrobidTeiParser;
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

        $this->app->singleton(GrobidClient::class, function () {
            return new GrobidClient(
                config('services.grobid.url')
            );
        });

        $this->app->singleton(GrobidTeiParser::class, function () {
            return new GrobidTeiParser();
        });
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
