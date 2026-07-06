<?php

use App\Models\Assembly;
use App\Models\RepeatmaskerAnalysis;
use App\Models\Taxon;
use App\Models\User;
use Illuminate\Auth\Access\Gate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('repeatmasker analysis can be deleted', function () {
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

    $analysis = RepeatmaskerAnalysis::factory()->create([
        'assembly_id' => $assembly->id,
    ]);

    Storage::disk('vault')->put(
        "taxa/562/{$assembly->id}/annotations/repeatmasker",
        'dummy'
    );

    Storage::disk('vault')->put(
        "taxa/562/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz",
        'dummy'
    );

    Storage::disk('vault')->put(
        "taxa/562/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz.tbi",
        'dummy'
    );

    $this->actingAs($user);
    $this->withoutExceptionHandling();

    $this->mock(Gate::class, function ($mock) {
        $mock->shouldReceive('authorize')->andReturn(true);
    });

    $response = $this->delete(route('repeatmasker.destroy', $analysis));

    $response->assertRedirect(
        "/taxa/562/{$assembly->id}/edit"
    );

    $this->assertDatabaseMissing('repeatmasker_analyses', [
        'id' => $analysis->id,
    ]);

    Storage::disk('vault')->assertMissing(
        "taxa/562/{$assembly->id}/annotations/repeatmasker"
    );

    Storage::disk('vault')->assertMissing(
        "taxa/562/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz"
    );

    Storage::disk('vault')->assertMissing(
        "taxa/562/{$assembly->id}/annotations/repeatmasker.sorted.gff3.gz.tbi"
    );

    Log::shouldHaveReceived('info')
        ->with("Deleted Annotation {$analysis->id} for {$assembly->id}")
        ->once();
});
