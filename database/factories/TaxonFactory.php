<?php

namespace Database\Factories;

use App\Models\Taxon;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaxonFactory extends Factory
{
    protected $model = Taxon::class;

    public function definition(): array
    {
        return [
            'ncbiTaxonID' => $this->faker->unique()->numberBetween(1000, 999999),
            'parentNcbiTaxonID' => $this->faker->numberBetween(1000, 999999),
            'scientificName' => $this->faker->words(2, true),
            'taxonRank' => $this->faker->randomElement([
                'species',
                'genus',
                'family',
                'order',
                'class',
                'phylum',
            ]),
            'commonName' => $this->faker->optional()->word(),
            'imageCredit' => $this->faker->optional()->url(),
            'phylopic' => $this->faker->boolean(),
        ];
    }
}
