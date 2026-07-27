<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CleanUploadsJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        $local = Storage::disk('local');
        $uploadPath = $local->path('uploads');

        if (! File::exists($uploadPath)) {
            Log::warning("Upload directory does not exist: {$uploadPath}");
            return;
        }

        # Only continue with files older than one week
        $cutoff = Carbon::now()->subWeek();
        $report = [];

        foreach (File::allFiles($uploadPath) as $file) {
            $lastModified = Carbon::createFromTimestamp($file->getMTime());

            if ($lastModified->lt($cutoff)) {
                $report[] = [
                    'path' => $file->getRelativePathname(),
                    'size' => $file->getSize(),
                    'last_modified' => $lastModified->toDateTimeString(),
                ];

                File::delete($file->getRealPath());
            }
        }

        if (count($report) > 0) {
            Log::info(
                "Deleted " . count($report) . " old upload file(s).",
                $report
            );
        } else {
            Log::info("No old upload files found.");
        }
    }
}
