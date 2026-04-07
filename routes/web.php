<?php

use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\AssemblyController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaxaminerController;
use App\Http\Controllers\TaxonController;
use App\Http\Controllers\VaultFileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [AssemblyController::class, 'stats']);

Route::middleware('auth')->group(function () {
    Route::get('/bookmarks', [BookmarkController::class, 'bookmarkedAssemblies'])->name('bookmarks.get');
    Route::post('/assemblies/{id}/bookmark', [BookmarkController::class, 'store'])->name('bookmarks.set');
    Route::delete('/assemblies/{id}/bookmark', [BookmarkController::class, 'delete'])->name('bookmarks.delete');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/assemblies', [AssemblyController::class, 'index'])->name('assemblies')->middleware(['auth']);
Route::get('/assemblies/{id}', [AssemblyController::class, 'show'])->name('assemblies.show')->middleware(['auth']);

Route::get('/browser', [AssemblyController::class, 'selection'])->name('browser')->middleware(['auth']);
Route::get('/browser/{id}', [AssemblyController::class, 'browser'])->name('assemblies.browser')->middleware(['auth']);

Route::get('/tol', function () {
    return Inertia::render('TreeOfLife');
})->name('tol')->middleware(['auth']);

Route::get('/import', function () {
    return Inertia::render('Import');
})->name('import')->middleware('auth');

/**
Route::middleware(['auth'])->any('/plugin/taxaminer/{any?}', function (Request $request, $any = '') {
    $proxyUrl = "http://gdock.izn-ffm.intern:1234/{$any}";

    $response = Http::withHeaders($request->headers->all())
        ->send($request->method(), $proxyUrl, [
            'query' => $request->query(),
            'body' => $request->getContent(),
        ]);

    return response($response->body(), $response->status())
        ->withHeaders($response->headers());
})->where('any', '.*');
 **/
Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/scatter', [TaxaminerController::class, 'scatterData'])->name('taxaminer.scatter');
Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/pca', [TaxaminerController::class, 'fetchPCA'])->name('taxaminer.pca');
Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/config', [TaxaminerController::class, 'fetchUserConfig'])->name('taxaminer.userconfig');
Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/summary', [TaxaminerController::class, 'fetchSummary'])->name('taxaminer.summary');
Route::post('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/diamond-hit', [TaxaminerController::class, 'fetchDiamond'])->name('taxaminer.diamond-hit');
Route::post('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/seq', [TaxaminerController::class, 'fetchSequence'])->name('taxaminer.sequence');

// Taxon Page
Route::get('/taxon/{id}', [TaxonController::class, 'index'])->name('taxon')->middleware(['auth']);

// Taxon Information
Route::get('/taxon-assemblies/{id}', [TaxonController::class, 'assemblies'])->name('taxon-assemblies')->middleware(['auth']);
Route::get('/lineage/{ncbiTaxonID}', [TaxonController::class, 'getLineage'])->middleware(['auth']);
Route::get('/taxon-geo-data/{ncbiTaxonID}', [TaxonController::class, 'getGeoData'])->middleware(['auth']);
Route::get('/taxon/infos/{ncbiTaxonID}', [TaxonController::class, 'getInfos'])->middleware(['auth']);

// Update Taxon
Route::post('/taxon/upload-image', [TaxonController::class, 'uploadImage'])->middleware(['auth']);
Route::post('/taxon/upload-icon', [TaxonController::class, 'uploadIcon'])->middleware(['auth']);
Route::post('/taxon/update-infos', [TaxonController::class, 'updateTexts'])->middleware(['auth']);
Route::post('/taxon/{taxonID}/geodata', [TaxonController::class, 'uploadGeoData'])->middleware(['auth']);
Route::delete('/taxon/{taxonID}/geodata/{id}', [TaxonController::class, 'deleteGeoData'])->middleware(['auth']);

// Get additional Taxon information
Route::get('/taxon/{taxonID}/image', [TaxonController::class, 'showImage'])->middleware(['auth']);
Route::get('/taxon/{taxonID}/icon', [TaxonController::class, 'showIcon'])->middleware(['auth']);

// UPLOADING DATA
Route::middleware([
    'auth',
])->group(function () {
    Route::post('/upload-assembly', [AssemblyController::class, 'uploadAssembly']);
    Route::post('/upload-annotation', [AssemblyController::class, 'uploadAnnotation']);
    Route::post('/upload-mapping', [AssemblyController::class, 'uploadMapping']);
    Route::post('/upload-busco', [AssemblyController::class, 'uploadBusco']);
    Route::post('/upload-repeatmasker', [AssemblyController::class, 'uploadRepeatmasker']);
    Route::post('/upload-taxaminer', [TaxaminerController::class, 'uploadTaxaminer']);
});

Route::get('/tracks/{path}', [VaultFileController::class, 'serve'])
    ->where('path', '.*')->middleware(['auth']);

Route::get('/stats', [AssemblyController::class, 'stats']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/api-tokens', [ApiTokenController::class, 'index'])->name('api-tokens.index');
    Route::post('/api-tokens', [ApiTokenController::class, 'store'])->name('api-tokens.store');
    Route::delete('/api-tokens/{token}', [ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');
});

require __DIR__.'/auth.php';
