<?php

use App\Jobs\CleanUploadsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

# Regularly clean upload directory
Schedule::job(new CleanUploadsJob)->daily();
