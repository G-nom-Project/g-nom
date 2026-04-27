<?php

namespace App\Jobs\Concerns;

use App\Models\User;
use App\Models\UserJob;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

trait DispatchesTrackableJobs
{
    public function dispatchTrackable(string $jobClass, array $payload = [], string $queue = 'default', ?string $block = null, ?int $user_id = null)
    {
        if ($user_id) {
            $user = User::where('id', $user_id)->firstOrFail();
        } else {
            $user = auth()->user();
        }

        $job = UserJob::create([
            'user_id' => $user->id,
            'job_class' => $jobClass,
            'status' => 'pending',
            'payload' => $payload,
            'queue' => $queue,
        ]);

        // Ensure only authorized users can create this job
        if ($user->cannot('create', $job)) {
            throw new AuthorizationException("User $user->id does not have permission to create jobs og type $jobClass");
        }
        $job->save();

        if ($block) {
            if (Cache::get($block)) {
                Log::info("Deferred dispatch of job $job->id due to lock $block");
            } else {
                Log::info('Dispatching trackable Job '.$job);
                dispatch(new $jobClass($job->id, ...array_values($payload)))->onQueue($queue);
            }
        } else {
            Log::info('Dispatching trackable Job '.$job);
            dispatch(new $jobClass($job->id, ...array_values($payload)))->onQueue($queue);
        }

        return $job;
    }
}
