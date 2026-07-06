<?php

namespace Database\Factories;

use App\Models\Assembly;
use App\Models\FcatAnalysis;
use Illuminate\Database\Eloquent\Factories\Factory;

class FcatAnalysisFactory extends Factory
{
    protected $model = FcatAnalysis::class;

    public function definition(): array
    {
        $total = $this->faker->numberBetween(100, 1000);

        $metrics = [];

        foreach (['m1', 'm2', 'm3', 'm4'] as $m) {
            $similar = $this->faker->numberBetween(0, $total);
            $remaining = $total - $similar;

            $dissimilar = $this->faker->numberBetween(0, $remaining);
            $remaining -= $dissimilar;

            $duplicated = $this->faker->numberBetween(0, $remaining);
            $remaining -= $duplicated;

            $missing = $this->faker->numberBetween(0, $remaining);
            $ignored = $remaining - $missing;

            $metrics["{$m}_similar"] = $similar;
            $metrics["{$m}_similarPercent"] = round($similar / $total * 100, 2);

            $metrics["{$m}_dissimilar"] = $dissimilar;
            $metrics["{$m}_dissimilarPercent"] = round($dissimilar / $total * 100, 2);

            $metrics["{$m}_duplicated"] = $duplicated;
            $metrics["{$m}_duplicatedPercent"] = round($duplicated / $total * 100, 2);

            $metrics["{$m}_missing"] = $missing;
            $metrics["{$m}_missingPercent"] = round($missing / $total * 100, 2);

            $metrics["{$m}_ignored"] = $ignored;
            $metrics["{$m}_ignoredPercent"] = round($ignored / $total * 100, 2);
        }

        return array_merge($metrics, [
            'assembly_id' => Assembly::factory(),
            'total' => $total,
            'genomeID' => $this->faker->uuid(),
        ]);
    }
}
