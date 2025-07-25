<?php

use App\Http\Controllers\AssemblyController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaxonController;
use App\Http\Controllers\VaultFileController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});


Route::middleware(['auth'])->group(function () {
    Route::resource('bookmarks', BookmarkController::class);
});

Route::get('/bookmarks', [BookmarkController::class, 'bookmarkedAssemblies'])->name('bookmarks')->middleware(['auth']);


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/assemblies', [AssemblyController::class, 'index'])->name('assemblies')->middleware(['auth']);
Route::get('/assemblies/{id}', [AssemblyController::class, 'show'])->name('assemblies.show');

Route::get('/browser', [AssemblyController::class, 'selection'])->name('browser');
Route::get('/browser/{id}', [AssemblyController::class, 'browser'])->name('assemblies.browser');

Route::get('/tol', function () {
    return Inertia::render('TreeOfLife');
}) ->name('tol');

Route::get('/import', function () {
    return Inertia::render('Import');
}) ->name('import');


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

// Taxon Page
Route::get('/taxon/{id}', [TaxonController::class, 'index'])->name('taxon');

// Taxon Information
Route::get('/taxon-assemblies/{id}', [TaxonController::class, 'assemblies'])->name('taxon-assemblies')->middleware(['auth']);
Route::get('/lineage/{ncbiTaxonID}', [TaxonController::class, 'getLineage'])->middleware(['auth']);
Route::get('/taxon-geo-data/{ncbiTaxonID}', [TaxonController::class, 'getGeoData'])->middleware(['auth']);
Route::get('/taxon/infos/{ncbiTaxonID}', [TaxonController::class, 'getInfos'])->middleware(['auth']);

// Taxa Images
Route::post('/taxon/upload-image', [TaxonController::class, 'uploadImage'])->middleware(['auth']);
Route::post('/taxon/update-infos', [TaxonController::class, 'updateTexts'])->middleware(['auth']);
Route::get('/taxon/{taxonID}/image', [TaxonController::class, 'showImage']);

// UPLOADING DATA
Route::post('/upload-assembly', [ImportController::class, 'uploadAssembly']);
Route::post('/upload-annotation', [ImportController::class, 'uploadAnnotation']);
Route::post('/upload-mapping', [ImportController::class, 'uploadMapping']);
Route::post('/upload-busco', [ImportController::class, 'uploadBusco']);

Route::get('/tracks/{path}', [VaultFileController::class, 'serve'])
    ->where('path', '.*')->middleware(['auth']);

require __DIR__.'/auth.php';
