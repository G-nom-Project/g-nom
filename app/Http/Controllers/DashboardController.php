<?php

namespace App\Http\Controllers;

use App\Services\ApplicationModeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    //
    public function view() {
        return Inertia::render('Dashboard', [
            'is_read_only' => app(ApplicationModeService::class)->isReadOnly(),
        ]);
    }
}
