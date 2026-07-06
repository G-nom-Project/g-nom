<?php

namespace Database\Factories;

use App\Models\Assembly;
use App\Models\RepeatmaskerAnalysis;
use Illuminate\Database\Eloquent\Factories\Factory;

class RepeatmaskerAnalysisFactory extends Factory
{
    protected $model = RepeatmaskerAnalysis::class;

    public function definition(): array
    {
        $genomeLength = $this->faker->numberBetween(1_000_000, 500_000_000);

        $categories = [
            'sines',
            'lines',
            'ltr_elements',
            'dna_elements',
            'unclassified',
            'rolling_circles',
            'small_rna',
            'satellites',
            'simple_repeats',
            'low_complexity',
        ];

        $data = [
            'assembly_id' => Assembly::factory(),
        ];

        $repetitiveLength = 0;

        foreach ($categories as $category) {
            $count = $this->faker->numberBetween(0, 10000);
            $length = $this->faker->numberBetween(0, intdiv($genomeLength, 10));

            $data[$category] = $count;
            $data["{$category}_length"] = $length;

            $repetitiveLength += $length;
        }

        $repetitiveLength = min($repetitiveLength, $genomeLength);
        $nonRepetitiveLength = $genomeLength - $repetitiveLength;

        $data['total_repetitive_length'] = $repetitiveLength;
        $data['total_non_repetitive_length'] = $nonRepetitiveLength;

        $data['total_repetitive_length_percent'] =
            round($repetitiveLength / $genomeLength * 100, 2);

        $data['total_non_repetitive_length_percent'] =
            round($nonRepetitiveLength / $genomeLength * 100, 2);

        $numberN = $this->faker->numberBetween(0, intdiv($genomeLength, 100));

        $data['numberN'] = $numberN;
        $data['percentN'] = round($numberN / $genomeLength * 100, 2);

        return $data;
    }
}
