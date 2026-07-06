<?php

namespace Database\Factories;

use App\Models\Assembly;
use App\Models\TaxaminerAnalysis;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaxaminerAnalysisFactory extends Factory
{
    protected $model = TaxaminerAnalysis::class;

    public function definition(): array
    {
        return [
            'assembly_id' => Assembly::factory(),
            'name' => $this->faker->words(2, true),
        ];
    }
}
