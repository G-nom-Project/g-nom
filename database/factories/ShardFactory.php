<?php

namespace Database\Factories;

use App\Models\Shard;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShardFactory extends Factory
{
    protected $model = Shard::class;

    public function definition(): array
    {
        return [
            // no required fields in schema
        ];
    }
}
