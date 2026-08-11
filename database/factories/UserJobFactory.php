<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserJob;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserJobFactory extends Factory
{
    protected $model = UserJob::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_class' => 'SingleBlastQuery',
            'status' => 'completed',
            'payload' => [],
            'result' => [],
        ];
    }
}
