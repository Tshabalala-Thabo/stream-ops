<?php

namespace Tests\Feature;

use App\Enums\ProcessingRunStatus;
use App\Enums\VideoStatus;
use App\Jobs\ProcessVideo;
use App\Models\Video;
use App\Services\VideoProcessing\FfmpegVideoProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class ProcessVideoTest extends TestCase
{
    use RefreshDatabase;

    public function test_process_video_generates_metadata_thumbnail_hls_and_marks_video_ready(): void
    {
        Storage::fake('public');
        [$ffprobePath, $ffmpegPath] = $this->createFakeFfmpegBinaries();
        config([
            'streamops.ffprobe_path' => $ffprobePath,
            'streamops.ffmpeg_path' => $ffmpegPath,
            'streamops.media_disk' => 'public',
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Queued,
            'source_disk' => 'public',
            'source_path' => 'videos/test-video/source/original.mp4',
            'duration_seconds' => null,
            'width' => null,
            'height' => null,
            'thumbnail_path' => null,
        ]);
        Storage::disk('public')->put($video->source_path, 'fake-video-bytes');

        (new ProcessVideo($video))->handle(app(FfmpegVideoProcessor::class));

        $video->refresh();
        $this->assertSame(VideoStatus::Ready, $video->status);
        $this->assertSame(124, $video->duration_seconds);
        $this->assertSame(1920, $video->width);
        $this->assertSame(1080, $video->height);
        $this->assertSame("videos/{$video->id}/thumbnails/default.jpg", $video->thumbnail_path);
        $this->assertSame("videos/{$video->id}/hls/master.m3u8", $video->playback_manifest_path);
        $this->assertNull($video->processing_error);
        Storage::disk('public')->assertExists($video->thumbnail_path);
        Storage::disk('public')->assertExists($video->playback_manifest_path);
        Storage::disk('public')->assertExists("videos/{$video->id}/hls/480p/index.m3u8");
        Storage::disk('public')->assertExists("videos/{$video->id}/hls/480p/segment_000.ts");
        Storage::disk('public')->assertExists("videos/{$video->id}/hls/720p/index.m3u8");
        Storage::disk('public')->assertExists("videos/{$video->id}/hls/1080p/index.m3u8");

        $processingRun = $video->processingRuns()->firstOrFail();
        $this->assertSame(ProcessingRunStatus::Completed, $processingRun->status);
        $this->assertNotNull($processingRun->started_at);
        $this->assertNotNull($processingRun->finished_at);
        $this->assertSame(124, $processingRun->metadata['durationSeconds']);
        $this->assertSame('h264', $processingRun->metadata['codec']);
        $this->assertSame(29.97, $processingRun->metadata['frameRate']);
        $this->assertSame("videos/{$video->id}/hls/master.m3u8", $processingRun->metadata['playbackManifestPath']);
        $this->assertCount(3, $processingRun->metadata['renditions']);
        $this->assertCount(1, $video->getMedia('thumbnails'));
        $this->assertCount(1, $video->getMedia('playback_manifests'));
        $this->assertCount(3, $video->renditions);
        $this->assertDatabaseHas('video_renditions', [
            'video_id' => $video->id,
            'label' => '1080p',
            'playlist_path' => "videos/{$video->id}/hls/1080p/index.m3u8",
        ]);
    }

    public function test_process_video_marks_video_and_run_failed_when_processing_fails(): void
    {
        Storage::fake('public');
        config([
            'streamops.ffprobe_path' => '/missing/ffprobe',
            'streamops.ffmpeg_path' => '/missing/ffmpeg',
            'streamops.media_disk' => 'public',
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Queued,
            'source_disk' => 'public',
            'source_path' => 'videos/test-video/source/original.mp4',
        ]);
        Storage::disk('public')->put($video->source_path, 'fake-video-bytes');

        try {
            (new ProcessVideo($video))->handle(app(FfmpegVideoProcessor::class));
            $this->fail('The processing job should throw when ffprobe is missing.');
        } catch (RuntimeException) {
            $video->refresh();
            $this->assertSame(VideoStatus::Failed, $video->status);
            $this->assertNotNull($video->processing_error);

            $processingRun = $video->processingRuns()->firstOrFail();
            $this->assertSame(ProcessingRunStatus::Failed, $processingRun->status);
            $this->assertNotNull($processingRun->finished_at);
            $this->assertNotNull($processingRun->error);
        }
    }

    public function test_process_video_job_uses_long_running_timeout_settings(): void
    {
        config(['streamops.processing_job_timeout_seconds' => 14400]);

        $job = new ProcessVideo(Video::factory()->make());

        $this->assertSame(14400, $job->timeout);
        $this->assertSame(14700, $job->uniqueFor);
        $this->assertSame(1, $job->tries);
        $this->assertTrue($job->failOnTimeout);
    }

    /**
     * @return array{string, string}
     */
    private function createFakeFfmpegBinaries(): array
    {
        $directory = storage_path('framework/testing/ffmpeg');
        File::ensureDirectoryExists($directory);

        $ffprobePath = $directory.'/ffprobe';
        $ffmpegPath = $directory.'/ffmpeg';

        file_put_contents($ffprobePath, <<<'SH'
#!/bin/sh
cat <<'JSON'
{
  "streams": [
    {
      "codec_type": "video",
      "codec_name": "h264",
      "width": 1920,
      "height": 1080,
      "avg_frame_rate": "30000/1001"
    }
  ],
  "format": {
    "duration": "123.45",
    "bit_rate": "4500000"
  }
}
JSON
SH);

        file_put_contents($ffmpegPath, <<<'SH'
#!/bin/sh
last=""
for arg in "$@"; do
  last="$arg"
done
case "$last" in
  *.jpg)
    printf 'fake-jpeg' > "$last"
    ;;
  *.m3u8)
    dir=$(dirname "$last")
    mkdir -p "$dir"
    printf '#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts\n#EXT-X-ENDLIST\n' > "$last"
    printf 'fake-segment' > "$dir/segment_000.ts"
    ;;
esac
SH);

        chmod($ffprobePath, 0755);
        chmod($ffmpegPath, 0755);

        return [$ffprobePath, $ffmpegPath];
    }
}
