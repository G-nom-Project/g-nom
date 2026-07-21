<?php

namespace Database\Factories;

use App\Models\AssemblyCollection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssemblyCollection>
 */
class AssemblyCollectionFactory extends Factory
{
    protected $model = AssemblyCollection::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'is_public' => false,
            'user_id' => User::factory(),
        ];
    }

    public function public(): static
    {
        return $this->state(fn () => [
            'is_public' => true,
        ]);
    }

    public function private(): static
    {
        return $this->state(fn () => [
            'is_public' => false,
        ]);
    }
}
