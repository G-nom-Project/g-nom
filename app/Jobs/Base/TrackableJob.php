<?php

namespace App\Jobs\Base;

use App\Models\UserJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

abstract class TrackableJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $userJobId;

    public function __construct(int $userJobId)
    {
        $this->userJobId = $userJobId;
    }

    protected function jobModel(): UserJob
    {
        return UserJob::findOrFail($this->userJobId);
    }

    protected function markRunning(): void
    {
        logger('Updating job', ['id' => $this->userJobId]);
        $this->jobModel()->update([
            'status' => 'running',
            'started_at' => now(),
        ]);
    }

    protected function markCompleted(array $result = []): void
    {
        $this->jobModel()->update([
            'status' => 'completed',
            'progress' => 100,
            'result' => $result,
            'finished_at' => now(),
        ]);
    }

    protected function markFailed(\Throwable $e): void
    {
        $this->jobModel()->update([
            'status' => 'failed',
            'error_message' => $e->getMessage(),
            'finished_at' => now(),
        ]);
    }

    protected function setProgress(int $progress): void
    {
        $this->jobModel()->update([
            'progress' => max(0, min(100, $progress)),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        $this->markFailed($e);
    }
}
