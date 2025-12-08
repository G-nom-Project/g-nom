<?php

use App\Http\Controllers\TaxonController;

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/taxon/{taxonID}/add-geodata', [TaxonController::class, 'uploadGeoData']);
});

require __DIR__.'/auth.php';

