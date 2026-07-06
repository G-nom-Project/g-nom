<?php

namespace Database\Factories;

use App\Models\Assembly;
use App\Models\GenomicAnnotation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class genomicAnnotationFactory extends Factory
{
    protected $model = GenomicAnnotation::class;

    public function definition(): array
    {
        return [
            'assembly_id' => Assembly::factory(),
            'user_id' => User::factory(),
            'name' => $this->faker->word(),
            'label' => $this->faker->optional()->sentence(2),
            'category' => 'Annotations',
            'featureCount' => $this->faker->numberBetween(100, 100000),
            'path' => $this->faker->filePath(),
        ];
    }
}
