<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Models\VideoRendition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_video_index_only_returns_ready_playable_videos(): void
    {
        $ready = Video::factory()->ready()->create(['title' => 'Playable video']);
        $processing = Video::factory()->processing()->create(['title' => 'Processing video']);
        $readyWithoutManifest = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'playback_manifest_path' => null,
        ]);

        $response = $this->getJson('/api/videos');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $ready->id)
            ->assertJsonMissing(['id' => $processing->id])
            ->assertJsonMissing(['id' => $readyWithoutManifest->id]);
    }

    public function test_public_video_show_hides_non_ready_videos(): void
    {
        $processing = Video::factory()->processing()->create();

        $this->getJson("/api/videos/{$processing->id}")
            ->assertNotFound();
    }

    public function test_public_renditions_return_playlist_level_data_without_segments(): void
    {
        $video = Video::factory()->ready()->create();
        VideoRendition::factory()->for($video)->create([
            'label' => '720p',
            'height' => 720,
            'width' => 1280,
            'playlist_path' => "videos/{$video->id}/hls/720p/index.m3u8",
            'segment_prefix' => "videos/{$video->id}/hls/720p/",
        ]);

        $response = $this->getJson("/api/videos/{$video->id}/renditions");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.label', '720p')
            ->assertJsonPath('data.0.segmentPrefix', "videos/{$video->id}/hls/720p/")
            ->assertJsonMissing(['segments' => []]);
    }

    public function test_storage_urls_use_configured_public_and_s3_disks(): void
    {
        Storage::fake('public');
        Storage::fake('s3');

        $local = Video::factory()->ready()->create([
            'source_disk' => 'public',
            'thumbnail_path' => 'videos/local/thumbnails/default.jpg',
        ]);
        $s3 = Video::factory()->ready()->create([
            'source_disk' => 's3',
            'thumbnail_path' => 'videos/cloud/thumbnails/default.jpg',
        ]);

        $this->getJson("/api/videos/{$local->id}")
            ->assertOk()
            ->assertJsonPath('data.thumbnailUrl', Storage::disk('public')->url('videos/local/thumbnails/default.jpg'));

        $this->getJson("/api/videos/{$s3->id}")
            ->assertOk()
            ->assertJsonPath('data.thumbnailUrl', Storage::disk('s3')->url('videos/cloud/thumbnails/default.jpg'));
    }
}
