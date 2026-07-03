<?php

use App\Enums\UploadSessionStatus;
use App\Enums\VideoStatus;
use App\Models\UploadSession;
use App\Models\Video;
use App\Services\VideoProcessing\FfmpegVideoProcessor;
use App\Support\UploadSessionFiles;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('streamops:cleanup-uploads', function (): int {
    $expiredSessions = UploadSession::query()
        ->with('video')
        ->where('status', UploadSessionStatus::Active)
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->get();

    foreach ($expiredSessions as $uploadSession) {
        $uploadSession->update([
            'status' => UploadSessionStatus::Failed,
        ]);

        $uploadSession->video->update([
            'status' => VideoStatus::Failed,
            'processing_error' => 'Upload session expired before completion.',
        ]);

        UploadSessionFiles::deleteTemporaryChunks($uploadSession);
    }

    $this->info("Cleaned {$expiredSessions->count()} expired upload session(s).");

    return 0;
})->purpose('Clean up expired StreamOps upload sessions and temporary chunks');

Artisan::command('streamops:thumbnails:regenerate {videoId?} {--all} {--force}', function (): int {
    $videoId = $this->argument('videoId');
    $all = (bool) $this->option('all');
    $force = (bool) $this->option('force');

    if ($videoId !== null && $all) {
        $this->error('Pass either a video ID or --all, not both.');

        return 1;
    }

    if ($videoId === null && ! $all) {
        $this->error('Pass a video ID or --all.');

        return 1;
    }

    $query = Video::query()
        ->whereNotNull('source_disk')
        ->whereNotNull('source_path');

    if ($videoId !== null) {
        $query->whereKey($videoId);
    } elseif (! $force) {
        $query->whereNull('thumbnail_path');
    }

    $videos = $query->get();

    if ($videoId !== null && $videos->isEmpty()) {
        $this->error("Video {$videoId} could not be found or does not have a source file.");

        return 1;
    }

    if ($videos->isEmpty()) {
        $this->info('No videos are eligible for thumbnail regeneration.');

        return 0;
    }

    $processor = app(FfmpegVideoProcessor::class);
    $regenerated = 0;
    $failed = 0;

    foreach ($videos as $video) {
        try {
            $result = $processor->regenerateThumbnail($video);
            $regenerated++;
            $this->info("Regenerated thumbnail for {$video->id}: {$result['thumbnailPath']}");
        } catch (Throwable $throwable) {
            $failed++;
            $this->warn("Failed to regenerate thumbnail for {$video->id}: {$throwable->getMessage()}");
        }
    }

    $this->info("Regenerated {$regenerated} thumbnail(s).");

    if ($failed > 0) {
        $this->warn("Failed {$failed} thumbnail(s).");

        return 1;
    }

    return 0;
})->purpose('Regenerate StreamOps video thumbnails without rebuilding playback assets');

Schedule::command('streamops:cleanup-uploads')->hourly();
