<?php

use App\Models\Assembly;
use App\Models\genomicAnnotation;
use App\Models\Taxon;
use App\Models\User;
use Illuminate\Auth\Access\Gate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('annotation can be deleted', function () {
    Storage::fake('vault');
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

    $annotation = genomicAnnotation::factory()->create([
        'assembly_id' => $assembly->id,
    ]);

    $this->actingAs($user);

    $this->mock(Gate::class, function ($mock) {
        $mock->shouldReceive('authorize')->andReturn(true);
    });

    $response = $this->delete(route('annotation.destroy', $annotation));

    $response->assertRedirect("/taxa/562/{$assembly->id}/edit");

    $this->assertDatabaseMissing('genomic_annotations', [
        'id' => $annotation->id,
    ]);
});
