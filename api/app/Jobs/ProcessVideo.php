<?php

namespace App\Jobs;

use App\Enums\ProcessingRunStatus;
use App\Models\Video;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessVideo implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Video $video) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->video->processingRuns()->create([
            'status' => ProcessingRunStatus::Queued,
            'metadata' => [
                'note' => 'Processing pipeline skeleton. FFmpeg work will be implemented in a later phase.',
            ],
        ]);
    }
}
