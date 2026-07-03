<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RegenerateThumbnailsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_regenerate_thumbnail_command_regenerates_one_existing_video(): void
    {
        Storage::fake('public');
        [$ffprobePath, $ffmpegPath] = $this->createFakeFfmpegBinaries();
        config([
            'streamops.ffprobe_path' => $ffprobePath,
            'streamops.ffmpeg_path' => $ffmpegPath,
            'streamops.media_disk' => 'public',
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'source_disk' => 'public',
            'source_path' => 'videos/test-video/source/original.mp4',
            'thumbnail_path' => 'videos/test-video/thumbnails/default.jpg',
        ]);
        Storage::disk('public')->put($video->source_path, 'fake-video-bytes');

        $this->artisan("streamops:thumbnails:regenerate {$video->id}")
            ->assertExitCode(0);

        $video->refresh();
        $this->assertSame("videos/{$video->id}/thumbnails/default.jpg", $video->thumbnail_path);
        Storage::disk('public')->assertExists($video->thumbnail_path);
        Storage::disk('public')->assertMissing("videos/{$video->id}/hls/master.m3u8");
    }

    public function test_regenerate_thumbnail_command_regenerates_all_eligible_videos_with_force(): void
    {
        Storage::fake('public');
        [$ffprobePath, $ffmpegPath] = $this->createFakeFfmpegBinaries();
        config([
            'streamops.ffprobe_path' => $ffprobePath,
            'streamops.ffmpeg_path' => $ffmpegPath,
            'streamops.media_disk' => 'public',
        ]);

        $firstVideo = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'source_disk' => 'public',
            'source_path' => 'videos/first/source/original.mp4',
            'thumbnail_path' => 'videos/first/thumbnails/default.jpg',
        ]);
        $secondVideo = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'source_disk' => 'public',
            'source_path' => 'videos/second/source/original.mp4',
            'thumbnail_path' => 'videos/second/thumbnails/default.jpg',
        ]);
        $missingSourceVideo = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'source_disk' => null,
            'source_path' => null,
            'thumbnail_path' => null,
        ]);
        Storage::disk('public')->put($firstVideo->source_path, 'fake-video-bytes');
        Storage::disk('public')->put($secondVideo->source_path, 'fake-video-bytes');

        $this->artisan('streamops:thumbnails:regenerate --all --force')
            ->assertExitCode(0);

        $firstVideo->refresh();
        $secondVideo->refresh();
        $missingSourceVideo->refresh();

        $this->assertSame("videos/{$firstVideo->id}/thumbnails/default.jpg", $firstVideo->thumbnail_path);
        $this->assertSame("videos/{$secondVideo->id}/thumbnails/default.jpg", $secondVideo->thumbnail_path);
        $this->assertNull($missingSourceVideo->thumbnail_path);
        Storage::disk('public')->assertExists($firstVideo->thumbnail_path);
        Storage::disk('public')->assertExists($secondVideo->thumbnail_path);
    }

    public function test_regenerate_thumbnail_command_requires_a_target(): void
    {
        $this->artisan('streamops:thumbnails:regenerate')
            ->assertExitCode(1);
    }

    /**
     * @return array{string, string}
     */
    private function createFakeFfmpegBinaries(): array
    {
        $directory = storage_path('framework/testing/thumbnail-command-ffmpeg');
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
esac
SH);

        chmod($ffprobePath, 0755);
        chmod($ffmpegPath, 0755);

        return [$ffprobePath, $ffmpegPath];
    }
}
