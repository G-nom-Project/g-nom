<?php

use App\Http\Controllers\AssemblyController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\TaxaminerController;
use App\Http\Controllers\TaxonController;

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/taxon/{taxonID}/add-geodata', [TaxonController::class, 'uploadGeoData']);
    Route::post('/assembly/create', [AssemblyController::class, 'uploadAssembly']);
    Route::post('/assembly/import-annotation', [AssemblyController::class, 'uploadAnnotation']);
    Route::post('/assembly/import-repeatmasker', [AssemblyController::class, 'uploadRepeatmasker']);
    Route::post('/assembly/import-busco', [AssemblyController::class, 'uploadBusco']);
    Route::post('/assembly/import-taxaminer', [TaxaminerController::class, 'uploadTaxaminer']);

    Route::get('/jobs/{id}/to-assembly', [JobController::class, 'map_job_to_assembly']);
});

// require __DIR__.'/auth.php';
