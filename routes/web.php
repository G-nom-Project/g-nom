<?php

use App\Http\Controllers\AnnotationController;
use App\Http\Controllers\ApiTokenController;
use App\Http\Controllers\AssemblyController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\BUSCOController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FCatController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\MappingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RepeatmaskerController;
use App\Http\Controllers\SparqlController;
use App\Http\Controllers\TaxaminerController;
use App\Http\Controllers\TaxonController;
use App\Http\Controllers\VaultFileController;
use App\Http\Controllers\WiggleTrackController;
use App\Http\Middleware\AiMode;
use App\Http\Middleware\GnomReadOnly;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [AssemblyController::class, 'stats']);

Route::middleware('auth')->group(function () {
    Route::get('/bookmarks', [BookmarkController::class, 'bookmarkedAssemblies'])->name('bookmarks.get');
    Route::post('/assemblies/{id}/bookmark', [BookmarkController::class, 'store'])->name('bookmarks.set');
    Route::delete('/assemblies/{id}/bookmark', [BookmarkController::class, 'delete'])->name('bookmarks.delete');
});

Route::get('/dashboard', [DashboardController::class, 'view'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Read-only collections routes
Route::middleware('auth')->group(function () {
    Route::get('/collections', [CollectionController::class, 'index'])->name('collections.index');
    Route::get('/collections/{id}', [CollectionController::class, 'view'])->name('collections.view');
    Route::get('/collections/{id}/tree', [TaxonController::class, 'getCollectionTol'])->name('collections.tol');
    Route::get('/collections/{id}/gallery', [CollectionController::class, 'gallery'])->name('collections.gallery');
});

// Collection actions
Route::middleware(['auth', GnomReadOnly::class])->group(function () {
    Route::put('/collections', [CollectionController::class, 'create'])->name('collections.create');
    Route::post('/collections/{id}', [CollectionController::class, 'update'])->name('collections.update');
    Route::post('/collections/{id}/remove-assembly', [CollectionController::class, 'remove_assembly'])->name('collections.remove_assembly');
    Route::post('/collections/{id}/add-assembly', [CollectionController::class, 'add_assembly'])->name('collections.add_assembly');
    Route::post('/collections/{id}/add-user', [CollectionController::class, 'add_user'])->name('collections.add_user');
    Route::delete('/collections/{id}', [CollectionController::class, 'delete'])->name('collections.delete');
});

Route::get('/assemblies', [AssemblyController::class, 'index'])->name('assemblies')->middleware(['auth']);
Route::get('/assemblies/{id}', [AssemblyController::class, 'show'])->name('assemblies.show')->middleware(['auth']);
Route::get('/assemblies/{id}/edit', [AssemblyController::class, 'editDashboard'])->name('assemblies.edit')->middleware(['auth', GnomReadOnly::class]);
Route::get('/assemblies/{id}/taxonomicAssignments', [AssemblyController::class, 'taxonomicAssignmentStats'])->name('assemblies.taxonStats')->middleware(['auth']);

Route::get('/browser', [AssemblyController::class, 'selection'])->name('browser')->middleware(['auth']);
Route::get('/browser/{id}', [AssemblyController::class, 'browser'])->name('assemblies.browser')->middleware(['auth']);

Route::middleware([
    'auth',
])->group(function () {
    Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/scatter', [TaxaminerController::class, 'scatterData'])->name('taxaminer.scatter');
    Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/pca', [TaxaminerController::class, 'fetchPCA'])->name('taxaminer.pca');
    Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/config', [TaxaminerController::class, 'fetchUserConfig'])->name('taxaminer.userconfig');
    Route::get('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/summary', [TaxaminerController::class, 'fetchSummary'])->name('taxaminer.summary');
    Route::post('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/diamond-hit', [TaxaminerController::class, 'fetchDiamond'])->name('taxaminer.diamond-hit');
    Route::post('/plugins/taxaminer/{taxonID}/{assemblyID}/{analysisID}/seq', [TaxaminerController::class, 'fetchSequence'])->name('taxaminer.sequence');
});

Route::middleware([
    'auth',
])->group(function () {
    Route::post('/taxon-by-name', [TaxonController::class, 'getTaxonByName'])->name('taxon-by-name');
    Route::get('/taxon-assemblies/{id}', [TaxonController::class, 'assemblies'])->name('taxon-assemblies');
    Route::get('/lineage/{ncbiTaxonID}', [TaxonController::class, 'getLineage']);
    Route::get('/taxon-geo-data/{ncbiTaxonID}', [TaxonController::class, 'getGeoData']);
    Route::get('/taxon/infos/{ncbiTaxonID}', [TaxonController::class, 'getInfos']);
    Route::get('/taxon/{taxonID}/image', [TaxonController::class, 'showImage']);
    Route::get('/taxon/{taxonID}/icon', [TaxonController::class, 'showIcon']);
});

// Update Taxon
Route::middleware(['auth', GnomReadOnly::class])->group(function () {
    Route::get('/taxon/{id}', [TaxonController::class, 'index'])->name('taxon')->middleware(['auth']);
    Route::post('/taxon/upload-image', [TaxonController::class, 'uploadImage'])->middleware(['auth']);
    Route::post('/taxon/upload-icon', [TaxonController::class, 'uploadIcon'])->middleware(['auth']);
    Route::post('/taxon/update-infos', [TaxonController::class, 'updateTexts'])->middleware(['auth']);
    Route::post('/taxon/{taxonID}/geodata', [TaxonController::class, 'uploadGeoData'])->middleware(['auth']);
    Route::delete('/taxon/{taxonID}/geodata/{id}', [TaxonController::class, 'deleteGeoData'])->middleware(['auth']);
});

// Uploading DATA
Route::middleware([
    'auth', GnomReadOnly::class,
])->group(function () {
    Route::get('/import', function () {
        return Inertia::render('Import');
    })->name('import');
    Route::post('/upload-assembly', [AssemblyController::class, 'uploadAssembly']);
    Route::post('/upload-coverage', [AssemblyController::class, 'uploadCoverage']);
    Route::post('/upload-annotation', [AssemblyController::class, 'uploadAnnotation']);
    Route::post('/upload-bigwig', [WiggleTrackController::class, 'importWiggleTrack']);
    Route::post('/upload-mapping', [AssemblyController::class, 'uploadMapping']);
    Route::post('/upload-busco', [AssemblyController::class, 'uploadBusco']);
    Route::post('/upload-fcat', [AssemblyController::class, 'uploadFcat']);
    Route::post('/upload-repeatmasker', [AssemblyController::class, 'uploadRepeatmasker']);
    Route::post('/upload-taxaminer', [TaxaminerController::class, 'uploadTaxaminer']);
});

// Deleting data
Route::middleware([
    'auth', GnomReadOnly::class,
])->group(function () {
    Route::delete('/annotations/{id}', [AnnotationController::class, 'destroy'])->name('annotation.destroy');
    Route::delete('/bigwigs/{id}', [WiggleTrackController::class, 'destroy'])->name('wiggle.destroy');
    Route::delete('/mappings/{id}', [MappingController::class, 'destroy'])->name('mapping.destroy');
    Route::delete('/buscos/{id}', [BUSCOController::class, 'destroy'])->name('busco.destroy');
    Route::delete('/fcats/{id}', [FCatController::class, 'destroy'])->name('fcat.destroy');
    Route::delete('/repeatmaskers/{id}', [RepeatmaskerController::class, 'destroy'])->name('repeatmasker.destroy');
    Route::delete('/taxaminer/{id}', [TaxaminerController::class, 'destroy'])->name('taxaminer.destroy');
});

// Jobs
Route::middleware([
    'auth',
])->group(function () {
    Route::get('/create-blast', [JobController::class, 'createBLAST']);
    Route::put('/create-blast', [JobController::class, 'dispatchBLAST']);
});

Route::get('/tracks/{path}', [VaultFileController::class, 'serve'])
    ->where('path', '.*')->middleware(['auth']);

Route::get('/stats', [AssemblyController::class, 'stats']);

Route::get('/jobs', [JobController::class, 'index'])->name('jobs')->middleware(['auth']);
Route::get('/job/{job_id}', [JobController::class, 'details'])->name('job.details')->middleware(['auth']);

// Create API tokens
Route::middleware(['auth', 'verified', GnomReadOnly::class])->group(function () {
    Route::get('/api-tokens', [ApiTokenController::class, 'index'])->name('api-tokens.index');
    Route::post('/api-tokens', [ApiTokenController::class, 'store'])->name('api-tokens.store');
    Route::delete('/api-tokens/{token}', [ApiTokenController::class, 'destroy'])->name('api-tokens.destroy');
});

Route::post('/sparql/query', [SparqlController::class, 'query'])->middleware('auth');
Route::get('/sparql', [SparqlController::class, 'queryPage'])->name('sparql')->middleware('auth');

Route::get('/tol', [TaxonController::class, 'getTol'])->name('tol')->middleware('auth');

Route::middleware(['auth', AiMode::class])->group(function () {
    Route::get('/assistant', [AssistantController::class, 'index'])
        ->name('assistant.index');

    Route::get('/assistant/{conversation}', [AssistantController::class, 'show'])
        ->name('assistant.show');
    Route::delete('/assistant/{conversation}', [AssistantController::class, 'delete'])
        ->name('assistant.delete');

    Route::post('/assistant', [AssistantController::class, 'store'])
        ->name('assistant.store');

    Route::post('/assistant/{conversation}/message', [
        AssistantController::class,
        'message',
    ])->name('assistant.message');
});

require __DIR__.'/auth.php';
