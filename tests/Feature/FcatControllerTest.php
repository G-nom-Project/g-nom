<?php

use App\Models\Assembly;
use App\Models\FcatAnalysis;
use App\Models\Taxon;
use App\Models\User;
use Illuminate\Auth\Access\Gate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

test('fcat analysis can be deleted', function () {
    config(['gnom.is_readonly' => 'normal']);
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

    $analysis = FcatAnalysis::factory()->create([
        'assembly_id' => $assembly->id,
    ]);

    $this->actingAs($user);
    $this->withoutExceptionHandling();

    $this->mock(Gate::class, function ($mock) {
        $mock->shouldReceive('authorize')->andReturn(true);
    });

    $response = $this->delete(route('fcat.destroy', $analysis));

    $response->assertRedirect(
        "/taxa/562/{$assembly->id}/edit"
    );

    $this->assertDatabaseMissing('fcat_analyses', [
        'id' => $analysis->id,
    ]);

    Log::shouldHaveReceived('info')
        ->with("Deleted fCat {$analysis->id} for {$assembly->id}")
        ->once();
});
