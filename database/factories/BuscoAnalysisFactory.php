<?php

namespace Database\Factories;

use App\Models\Assembly;
use App\Models\BuscoAnalysis;
use Illuminate\Database\Eloquent\Factories\Factory;

class BuscoAnalysisFactory extends Factory
{
    protected $model = BuscoAnalysis::class;

    public function definition(): array
    {
        $total = $this->faker->numberBetween(100, 1000);

        $completeSingle = $this->faker->numberBetween(0, $total);
        $remaining = $total - $completeSingle;

        $completeDuplicated = $this->faker->numberBetween(0, $remaining);
        $remaining -= $completeDuplicated;

        $fragmented = $this->faker->numberBetween(0, $remaining);
        $missing = $remaining - $fragmented;

        return [
            'assembly_id' => Assembly::factory(),

            'name' => $this->faker->words(2, true),

            'completeSingle' => $completeSingle,
            'completeDuplicated' => $completeDuplicated,
            'fragmented' => $fragmented,
            'missing' => $missing,
            'total' => $total,

            'completeSinglePercent' => round($completeSingle / $total * 100, 2),
            'completeDuplicatedPercent' => round($completeDuplicated / $total * 100, 2),
            'fragmentedPercent' => round($fragmented / $total * 100, 2),
            'missingPercent' => round($missing / $total * 100, 2),

            'dataset' => $this->faker->randomElement([
                'bacteria_odb10',
                'archaea_odb10',
                'eukaryota_odb10',
                'fungi_odb10',
            ]),

            'buscoMode' => $this->faker->randomElement([
                'genome',
                'proteins',
                'transcriptome',
            ]),

            'targetFile' => $this->faker->filePath(),
        ];
    }
}
