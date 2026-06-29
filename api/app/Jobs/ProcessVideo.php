<?php

namespace App\Jobs;

use App\Enums\ProcessingRunStatus;
use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\VideoProcessing\FfmpegVideoProcessor;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ProcessVideo implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public bool $failOnTimeout = true;

    public int $timeout;

    public int $tries = 1;

    public int $uniqueFor;

    /**
     * Create a new job instance.
     */
    public function __construct(public Video $video)
    {
        $this->timeout = (int) config('streamops.processing_job_timeout_seconds', 14400);
        $this->uniqueFor = $this->timeout + 300;
    }

    public function uniqueId(): string
    {
        return (string) $this->video->id;
    }

    /**
     * Execute the job.
     */
    public function handle(FfmpegVideoProcessor $processor): void
    {
        $this->video->refresh();

        $processingRun = $this->video->processingRuns()->create([
            'status' => ProcessingRunStatus::Running,
            'started_at' => now(),
            'metadata' => [
                'stage' => 'metadata_thumbnail_hls',
            ],
        ]);

        $this->video->update([
            'status' => VideoStatus::Processing,
            'processing_error' => null,
        ]);

        try {
            $result = $processor->process($this->video);

            $this->video->update([
                'status' => VideoStatus::Ready,
                'duration_seconds' => $result->durationSeconds,
                'width' => $result->width,
                'height' => $result->height,
                'thumbnail_path' => $result->thumbnailPath,
                'playback_manifest_path' => $result->playbackManifestPath,
            ]);

            $this->catalogThumbnail();
            $this->catalogPlaybackManifest();
            $this->syncRenditions($result->renditions);

            $processingRun->update([
                'status' => ProcessingRunStatus::Completed,
                'finished_at' => now(),
                'metadata' => [
                    ...$result->metadata,
                    'thumbnailPath' => $result->thumbnailPath,
                    'playbackManifestPath' => $result->playbackManifestPath,
                    'note' => 'Metadata, thumbnail, and HLS playback generation completed.',
                ],
            ]);
        } catch (Throwable $throwable) {
            $this->video->update([
                'status' => VideoStatus::Failed,
                'processing_error' => $throwable->getMessage(),
            ]);

            $processingRun->update([
                'status' => ProcessingRunStatus::Failed,
                'finished_at' => now(),
                'error' => $throwable->getMessage(),
                'metadata' => [
                    ...($processingRun->metadata ?? []),
                    'stage' => 'metadata_thumbnail_hls',
                ],
            ]);

            throw $throwable;
        }
    }

    private function catalogThumbnail(): void
    {
        $this->video->refresh();

        if ($this->video->thumbnail_path === null || $this->video->source_disk === null) {
            return;
        }

        if ($this->video->getFirstMedia('thumbnails') !== null) {
            return;
        }

        $this->video
            ->addMediaFromDisk($this->video->thumbnail_path, $this->video->source_disk)
            ->preservingOriginal()
            ->withCustomProperties([
                'storage_provider' => $this->video->source_disk,
                'object_key' => $this->video->thumbnail_path,
                'generated_by' => self::class,
            ])
            ->toMediaCollection('thumbnails', $this->video->source_disk);
    }

    private function catalogPlaybackManifest(): void
    {
        $this->video->refresh();

        if ($this->video->playback_manifest_path === null || $this->video->source_disk === null) {
            return;
        }

        if ($this->video->getFirstMedia('playback_manifests') !== null) {
            return;
        }

        $this->video
            ->addMediaFromDisk($this->video->playback_manifest_path, $this->video->source_disk)
            ->preservingOriginal()
            ->withCustomProperties([
                'storage_provider' => $this->video->source_disk,
                'object_key' => $this->video->playback_manifest_path,
                'generated_by' => self::class,
            ])
            ->toMediaCollection('playback_manifests', $this->video->source_disk);
    }

    /**
     * @param  array<int, array{label: string, width: int, height: int, bitrate: int, codec: ?string, playlistPath: string, segmentPrefix: string}>  $renditions
     */
    private function syncRenditions(array $renditions): void
    {
        $this->video->renditions()->delete();

        foreach ($renditions as $rendition) {
            $this->video->renditions()->create([
                'label' => $rendition['label'],
                'width' => $rendition['width'],
                'height' => $rendition['height'],
                'bitrate' => $rendition['bitrate'],
                'codec' => $rendition['codec'],
                'playlist_path' => $rendition['playlistPath'],
                'segment_prefix' => $rendition['segmentPrefix'],
            ]);
        }
    }
}
