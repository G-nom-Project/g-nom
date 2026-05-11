<?php

namespace App\Jobs\Concerns;

use App\Models\User;
use App\Models\UserJob;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

trait DispatchesTrackableJobs
{
    /**
     * Create a trackable job WITHOUT dispatching it.
     */
    protected function makeTrackableJob(
        string $jobClass,
        array $payload = [],
        string $queue = 'default',
        ?int $user_id = null,
        ?string $chainId = null
    ): array {
        $user = $user_id
            ? User::findOrFail($user_id)
            : auth()->user();

        $jobModel = UserJob::create([
            'user_id' => $user->id,
            'job_class' => $jobClass,
            'status' => 'pending',
            'payload' => $payload,
            'queue' => $queue,
            'chain_id' => $chainId,
        ]);

        if ($user->cannot('create', $jobModel)) {
            throw new AuthorizationException(
                "User {$user->id} cannot create job {$jobClass}"
            );
        }

        $jobInstance = new $jobClass(
            $jobModel->id,
            ...array_values($payload)
        );

        return [$jobModel, $jobInstance];
    }

    /**
     * Dispatch a single trackable job (your original behavior).
     */
    public function dispatchTrackable(
        string $jobClass,
        array $payload = [],
        string $queue = 'default',
        ?string $block = null,
        ?int $user_id = null
    ) {
        [$jobModel, $jobInstance] = $this->makeTrackableJob(
            $jobClass,
            $payload,
            $queue,
            $user_id
        );

        if ($block) {
            if (Cache::get($block)) {
                Log::info("Deferred dispatch of job {$jobModel->id} due to lock {$block}");

                return $jobModel;
            }
        }

        Log::info("Dispatching trackable job {$jobModel->id}");

        dispatch($jobInstance)->onQueue($queue);

        return $jobModel;
    }

    /**
     * Dispatch a chain of trackable jobs.
     */
    public function dispatchTrackableChain(array $jobs, string $queue = 'default')
    {
        $chain = [];
        $models = [];

        $chainId = (string) Str::uuid();

        foreach ($jobs as $jobDef) {
            [$jobModel, $jobInstance] = $this->makeTrackableJob(
                $jobDef['class'],
                $jobDef['payload'] ?? [],
                $jobDef['queue'] ?? $queue,
                $jobDef['user_id'] ?? null,
                $chainId
            );

            $chain[] = $jobInstance;
            $models[] = $jobModel;
        }

        Log::info("Dispatching job chain {$chainId}");

        Bus::chain($chain)
            ->onQueue($queue)
            ->dispatch();

        return $models;
    }
}
