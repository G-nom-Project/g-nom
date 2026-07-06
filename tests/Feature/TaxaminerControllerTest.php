<?php

use App\Models\Assembly;
use App\Models\TaxaminerAnalysis;
use App\Models\Taxon;
use App\Models\User;
use Illuminate\Auth\Access\Gate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('taxaminer analysis can be deleted', function () {
    Storage::fake('vault');
    Log::spy();

    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    $taxon = Taxon::factory()->create([
        'ncbiTaxonID' => 562,
    ]);

    $assembly = Assembly::factory()->create([
        'taxon_ncbiTaxonID' => $taxon->ncbiTaxonID,
    ]);

    $analysis = TaxaminerAnalysis::factory()->create([
        'assembly_id' => $assembly->id,
    ]);

    Storage::disk('vault')->put(
        "taxa/562/{$assembly->id}/taxaminerAnalyses/{$analysis->id}/summary.txt",
        'dummy'
    );

    $this->actingAs($user);
    $this->withoutExceptionHandling();

    $this->mock(Gate::class, function ($mock) {
        $mock->shouldReceive('authorize')->andReturn(true);
    });

    $response = $this->delete(route('taxaminer.destroy', $analysis));

    $response->assertRedirect(
        "/taxa/562/{$assembly->id}/edit"
    );

    $this->assertDatabaseMissing('taxaminer_analyses', [
        'id' => $analysis->id,
    ]);

    Storage::disk('vault')->assertMissing(
        "taxa/562/{$assembly->id}/taxaminerAnalyses/{$analysis->id}"
    );

    Log::shouldHaveReceived('info')
        ->with("Deleting taxa/562/{$assembly->id}/taxaminerAnalyses/{$analysis->id}")
        ->once();

    Log::shouldHaveReceived('info')
        ->with("Deleted taXaminer Analysis {$analysis->id} for {$assembly->id}")
        ->once();
});
