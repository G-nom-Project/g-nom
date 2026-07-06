<?php

namespace Database\Factories;

use App\Models\Assembly;
use App\Models\Shard;
use App\Models\Taxon;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AssemblyFactory extends Factory
{
    protected $model = Assembly::class;

    public function definition(): array
    {
        $taxon = Taxon::factory()->create();

        return [
            'shard_id' => Shard::factory(),
            'name' => $this->faker->words(3, true),
            'infoText' => $this->faker->sentence(),
            'taxon_ncbiTaxonID' => $taxon->ncbiTaxonID,
            'addedBy' => User::factory()->create()->id,
            'public' => false,

            'numberOfSequences' => $this->faker->numberBetween(100, 10000),
            'cumulativeSequenceLength' => $this->faker->numberBetween(100000, 10000000),
            'n50' => $this->faker->numberBetween(1000, 100000),
            'n90' => $this->faker->numberBetween(100, 50000),
            'shortestSequence' => $this->faker->numberBetween(50, 500),
            'longestSequence' => $this->faker->numberBetween(1000, 100000),

            'medianSequence' => $this->faker->randomFloat(2, 100, 10000),
            'meanSequence' => $this->faker->randomFloat(2, 100, 10000),

            'gcPercent' => $this->faker->randomFloat(2, 30, 70),
            'gcPercentMasked' => $this->faker->randomFloat(2, 30, 70),

            'lengthDistributionString' => [],
            'charCount' => [],

            'label' => $this->faker->optional()->word(),
            'user_id' => User::factory(),
        ];
    }
}
