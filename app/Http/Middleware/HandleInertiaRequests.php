<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'gnom' => [
                'title' => config('gnom.custom_title'),
                'app_url' => config('gnom.app_url'),
                'custom_logo' => config('gnom.custom_logo'),
            ],
            'reverb' => [
                'key' => config('gnom.reverb_key'),
                'host' => config('gnom.reverb_host'),
                'port' => config('gnom.reverb_port'),
                'scheme' => config('gnom.reverb_scheme'),
            ]
        ];
    }
}
